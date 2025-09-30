import { Component, OnInit, ChangeDetectorRef   } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'; // ✅ for mat-icon
import { AuthService } from '../../../_shared/service/auth-service';
import { MatSelectModule } from '@angular/material/select';

import { Chart, registerables } from 'chart.js';

import { FormControlErrorsComponent } from '../../../_shared/component/form-control-errors/form-control-errors.component';

import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { timeRangeValidator, withinClinicHoursValidator } from '../../../utils/forms/form-custom-validator';



// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-profile-index',
  templateUrl: './profile-index.html',
  styleUrl: './profile-index.css',
  imports: [MatCardModule, MatDividerModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatIconModule, MatSelectModule, FormControlErrorsComponent],
})
export class ProfileIndex implements OnInit {
  profileForm!: FormGroup;
  avatarUrl: string = 'assets/images/default-dentist.png'; // default profile pic

  user = {}

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
  ) {}

  // figure out getting the user existing data
  // populate the form by retreiving the data
  // use validations (refer to the user update)

  ngOnInit(): void {

    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
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
          this.profileForm.patchValue(user);
          console.log('this.user', this.user);

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

          // ✅ Replace operatingHours inside clinic.value
          const clinicValueGroup = this.profileForm.get('clinic.value') as FormGroup;
          if (clinicValueGroup) {
            clinicValueGroup.setControl('operatingHours', clinicOperatingHoursArray);
          }

          // ✅ Replace top-level operatingHours
          this.profileForm.setControl('operatingHours', operatingHoursArray);

          // ✅ Track selected days
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
    console.log('clinicOperatingHours values:', this.clinicOperatingHours.value.length);

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

  onSave(): void {
    if (this.profileForm.valid) {
      console.log('Profile Saved:', this.profileForm.value);
      // 🔗 API call here
    }
  }
}
