import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../_shared/service/auth-service';
import { UserService } from '../../../_shared/service/user-service';
import { FormControlErrorsComponent } from '../../../_shared/component/form-control-errors/form-control-errors.component';

import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { timeRangeValidator, withinClinicHoursValidator } from '../../../utils/forms/form-custom-validator';

import { CommonModule } from '@angular/common';

import { Chart, registerables } from 'chart.js';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';


Chart.register(...registerables);

// ✅ Proper User interface
interface User {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  emailAddress: string;
  mobileNumber: string;
  role: string;
  address: string;
  username: string;
  operatingHours: { day: string; startTime: string; endTime: string }[];
  clinic?: {
    _id?: string;
    operatingHours?: { day: string; startTime: string; endTime: string }[];
  };
}

@Component({
  selector: 'app-profile-index',
  templateUrl: './profile-index.html',
  styleUrls: ['./profile-index.css'],
  imports: [
    MatCardModule,
    MatDividerModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    FormControlErrorsComponent,
    CommonModule,
    MatDialogModule
  ],
})
export class ProfileIndex implements OnInit {
  @ViewChild('avatarModal') avatarModal!: TemplateRef<any>;
  profileForm!: FormGroup;
  avatarUrl: string | null = null;
  user: User | null = null;

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
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      emailAddress: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      address: ['', Validators.required],
      role: [''],
      operatingHours: this.fb.array([]),
      clinic: this.fb.group({
        value: this.fb.group({
          operatingHours: this.fb.array([])
        })
      })
    });

    // Format mobile number
    const mobileNumber = this.profileForm.get('mobileNumber');
    if (mobileNumber) applyPHMobilePrefix(mobileNumber);

    // Load current user
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          this.profileForm.patchValue(user);
          if(user?.profilePicture) {
            this.loadProfilePicture(user._id);
          }
          // Dentist operating hours
          const operatingHoursArray = this.fb.array(
            (user.operatingHours || []).map(o =>
              this.fb.group({
                day: [o.day, Validators.required],
                startTime: [o.startTime, Validators.required],
                endTime: [o.endTime, Validators.required],
              }, {
                validators: [
                  timeRangeValidator,
                  withinClinicHoursValidator(user.clinic?.operatingHours || [])
                ]
              })
            )
          );

          // Clinic operating hours
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

          // Track selected days
          this.selectedDays = new Set((user.operatingHours || []).map(o => o.day));
          this.operatingHours.valueChanges.subscribe((hours) => {
            this.selectedDays = new Set(hours.map((h: any) => h.day).filter(Boolean));
          });
        }
      }
    });
  }

  // --- Getters ---
  get operatingHours(): FormArray {
    return this.profileForm.get('operatingHours') as FormArray;
  }

  get clinicOperatingHours(): FormArray {
    return this.profileForm.get('clinic.value.operatingHours') as FormArray;
  }

  // added functions
  
  openAvatarModal() {
    this.dialog.open(this.avatarModal);
  }

  closeAvatarModal() {
    this.dialog.closeAll();
    this.selectedFile = null;
  }

  onUpload() {
    console.log('this.selectedFile ', this.selectedFile)
  if (!this.selectedFile) return;

  if(this.user) {
    console.log('this.user._id: ', this.user._id)
    console.log('this.selectedFile ', this.selectedFile)
    this.userService.uploadProfilePicture(this.user._id, this.selectedFile)
    .subscribe({
      next: (res) => {
        alert('Profile picture uploaded successfully!');
        this.closeAvatarModal(); // close the dialog
      },
      error: (err) => {
        console.error('Upload error', err);
        alert('Failed to upload profile picture.');
      }
    });
  }
    // console.log('result index TS', result)
    // TODO: call API to save file

    // to activate/use
    // this.closeAvatarModal();
  }



  // --- Schedule Manipulation ---
  onAddSchedule(): void {
    const usedDays = this.operatingHours.controls.map(group => group.get('day')?.value);

    if (this.clinicOperatingHours.value) {
      const nextSchedule = this.clinicOperatingHours.value.find(
        (sched: { day: string; startTime: string; endTime: string }) => !usedDays.includes(sched.day)
      );

      if (nextSchedule) {
        const newGroup = this.fb.nonNullable.group({
          day: [{ value: nextSchedule.day, disabled: usedDays.includes(nextSchedule.day) }],
          startTime: [nextSchedule.startTime],
          endTime: [nextSchedule.endTime],
        }, { validators: [
          timeRangeValidator,
          withinClinicHoursValidator(this.clinicOperatingHours.value)
        ]});

        // Update times when day changes
        newGroup.get('day')?.valueChanges.subscribe((selectedDay: string) => {
          const defaultSchedule = (this.clinicOperatingHours.value as any[]).find(d => d.day === selectedDay);
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
      .filter(Boolean) as string[];
  }

  onAvatarChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.avatarUrl = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  loadProfilePicture(userId: string) {
    this.userService.getProfilePicture(userId).subscribe({
      next: (url) => this.avatarUrl = url,
      error: () => this.avatarUrl = null
    });
  }

  // --- Save Profile ---
  onSave(): void {
    if (!this.user) return; // Safety check

    if (this.profileForm.valid) {
      // Prepare payload
      const payload = {
        ...this.profileForm.value,            // all form fields
        clinic: this.user.clinic?._id,       // send only clinic ID
        username: this.user.username          // ensure username included
      };

      this.userService.update(this.user._id, payload).subscribe({
        next: (res) => alert('Profile updated successfully!'),
        error: (err) => alert(`Failed to save profile: ${err}`)
      });
    }
  }
}
