import { Component, OnInit, ChangeDetectorRef   } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'; // ✅ for mat-icon
import { AuthService } from '../../../_shared/service/auth-service';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

import { FormControlErrorsComponent } from '../../../_shared/component/form-control-errors/form-control-errors.component';

import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { timeRangeValidator, withinClinicHoursValidator } from '../../../utils/forms/form-custom-validator';
import { Router } from '@angular/router';

import { UserService } from '../../../_shared/service/user-service';

import { UserPayload } from '../../../admin/user/user-form/user-payload';


// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-user-settings-update',
  templateUrl: './user-settings-update.html',
  styleUrl: './user-settings-update.css',
  imports: [MatCardModule, MatDividerModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatIconModule, MatSelectModule, FormControlErrorsComponent, CommonModule],
})
export class UserSettingsUpdate implements OnInit {
  profileForm!: FormGroup;
  avatarUrl: string = 'assets/images/default-dentist.png'; // default profile pic

  user: { _id?: string; clinic?: any; role?: string; username?: string; operatingHours?: any[] } = {};
  isDentist = false
  isLoading = false
  id = ''
  days = [
    { code: 'monday', label: 'Monday' },
    { code: 'tuesday', label: 'Tuesday' },
    { code: 'wednesday', label: 'Wednesday' },
    { code: 'thursday', label: 'Thursday' },
    { code: 'friday', label: 'Friday' },
    { code: 'saturday', label: 'Saturday' },
    { code: 'sunday', label: 'Sunday' }
  ];

  selectedDays = new Set<string>();

  constructor(
    private fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly userService: UserService
  ) {}

  // figure out getting the user existing data
  // populate the form by retreiving the data
  // use validations (refer to the user update)

  ngOnInit(): void {

    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      address: ['', Validators.required],
      emailAddress: ['', [Validators.required, Validators.email]], // <-- changed
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      role: [''],
      operatingHours: this.fb.array([]),
      clinic: this.fb.group({
        value: this.fb.group({
          operatingHours: this.fb.array([]) 
        })
      })
    });

    // change the format to E.164
    const mobileNumber = this.profileForm.get('mobileNumber');
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }

    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          this.id = user._id;
          this.profileForm.patchValue(user);
          if (user.role === 'dentist') {
            this.isDentist == true
          } else {
            this.isDentist == false
          }
          // dentist available days/hours
          const operatingHoursArray = this.fb.array(
            user.operatingHours.map(o =>
              this.fb.group({
                day: [o.day, Validators.required],
                startTime: [o.startTime, Validators.required],
                endTime: [o.endTime, Validators.required],
              },
                {
                  validators: [
                    timeRangeValidator,
                    withinClinicHoursValidator(user.clinic?.operatingHours || [])
                  ]
                }
              )
            )
          );

          // clinic operating day/hours
          const clinicOperatingHoursArray = this.fb.array(
            (user.clinic?.operatingHours || []).map(o =>
              this.fb.group({
                day: [o.day, Validators.required],
                startTime: [o.startTime, Validators.required],
                endTime: [o.endTime, Validators.required],
              })
            )
          );

          const clinicValueGroup = this.profileForm.get('clinic.value') as FormGroup;
          if (clinicValueGroup) {
            clinicValueGroup.setControl('operatingHours', clinicOperatingHoursArray);
          }

          this.profileForm.setControl('operatingHours', operatingHoursArray);

          this.selectedDays = new Set(user.operatingHours.map(o => o.day));
          this.operatingHours.valueChanges.subscribe((hours) => {
            this.selectedDays = new Set(hours.map((h: any) => h.day).filter(Boolean));
          });
        }
      }
    });


  }

  get operatingHours(): FormArray {
    return this.profileForm.get('operatingHours') as FormArray;
  }

  get clinicOperatingHours(): FormArray {
    return this.profileForm.get('clinic.value.operatingHours') as FormArray;
  }

  onAddSchedule () {
    const usedDays = this.operatingHours.controls.map(group => group.get('day')?.value);

    if (this.clinicOperatingHours.value) {
      const nextSchedule = this.clinicOperatingHours.value.find(
        (sched: { day: string; startTime: string; endTime: string }) =>
          !usedDays.includes(sched.day)
      );
      
      if( nextSchedule ) {
        const newGroup = this.fb.nonNullable.group({
          day: [{ value: nextSchedule.day, disabled: usedDays.includes(nextSchedule.day) }],
          startTime: [nextSchedule.startTime],
          endTime: [nextSchedule.endTime],
        }, { validators: [
          timeRangeValidator,
          withinClinicHoursValidator(this.clinicOperatingHours.value)
        ] });

        // Subscribe to day changes for dynamic updates
        newGroup.get('day')?.valueChanges.subscribe((selectedDay: string) => {
          const defaultSchedule = (this.clinicOperatingHours?.value as { day: string; startTime: string; endTime: string }[])
            .find((d) => d.day === selectedDay);

          if (defaultSchedule) {
            newGroup.get('startTime')?.setValue(defaultSchedule.startTime);
            newGroup.get('endTime')?.setValue(defaultSchedule.endTime);
          }
        });
        this.operatingHours.push(newGroup);
      }
    }
  }

  cancelEdit() {
    this.router.navigate(['/admin/user-settings/index'])
  }

  removeOperatingHour(index: number): void {
    this.operatingHours.removeAt(index);
  }

  getSelectedDays(currentIndex: number): string[] {
    return this.operatingHours.controls
      .map((group, i) => i !== currentIndex ? group.get('day')?.value : null)
      .filter(day => !!day) as string[];
  }

  onAvatarChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.avatarUrl = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

onSave() {
  if (this.profileForm.valid && this.id) {
    this.isLoading = true;

    const formValue = this.profileForm.value;

    // Safely build your user payload (based on your backend’s UserPayload interface)
    const userData: UserPayload = {
      firstName: formValue.firstName,
      middleName: formValue.middleName || '',
      lastName: formValue.lastName,
      emailAddress: formValue.emailAddress,
      mobileNumber: formValue.mobileNumber,
      address: formValue.address,
      clinic: this.user?.clinic?._id || undefined, 
      operatingHours: formValue.operatingHours || [],
      role: formValue.role || this.user.role,
      username: this.user.username 
    };


    this.userService.update(this.id, userData).subscribe({
      next: (res) => {
        this.router.navigate(['/admin/user-settings']).then(() => {
          window.location.reload();
        });
      },
      error: (err) => {
        alert(`Something went wrong: ${err?.message || err}`);
      },
      complete: () => {
        alert('Successfully Updated')
        this.router.navigate(['/app/user-settings/index'])
        this.isLoading = false
      }
    });
  } else {
    console.warn('Form invalid or missing ID:', this.profileForm.value);
  }
}

}
