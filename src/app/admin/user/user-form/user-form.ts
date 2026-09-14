import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormComponent } from '../../../_shared/component/form/form.component';
import { FormField } from '../../../_shared/component/form/form-field.interface';
import { Clinic } from '../../../_shared/model/clinic';
import { Day } from '../../../_shared/model/day';
import { RxOperatingHour } from '../../../_shared/model/reactive/rx-operating-hours';
import { buildStaffUserPayload } from '../../../_shared/model/staff-user-payload';
import { assignedClinicIds, User, UserStatus } from '../../../_shared/model/user';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { passwordMatchValidator, timeRangeValidator } from '../../../utils/forms/form-custom-validator';
import { PASSWORD_REQUIREMENTS_MESSAGE, strongPasswordValidators } from '../../../utils/forms/password-policy';
import { RxStaffUserForm } from './rx-user-form.interface';
import { UserPayload } from './user-payload';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule, FormComponent],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm implements OnInit, OnChanges {
  @Output() onSubmitEvent = new EventEmitter<UserPayload>();
  @Input() isLoading = false;
  @Input() clinics: Clinic[] = [];
  @Input() user: User = this.getDefaultUser();
  @Input() days: Day[] = [];

  rxform!: FormGroup<RxStaffUserForm>;
  userFields: FormField[] = [];
  hide = signal(true);

  constructor(
    private readonly fb: FormBuilder,
    _clinicService: ClinicService,
  ) {}

  clickEvent(event: MouseEvent): void {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  getDefaultUser(): User {
    return {
      username: '',
      firstName: '',
      middleName: '',
      lastName: '',
      emailAddress: '',
      mobileNumber: '',
      address: '',
      password: '',
      clinics: [],
      role: 'user',
      appointments: [],
      operatingHours: [],
      status: UserStatus.PENDING,
    };
  }

  ngOnInit(): void {
    const isUpdate = !!this.user._id;

    this.rxform = this.fb.nonNullable.group({
      firstName: [this.user.firstName, Validators.required],
      middleName: [this.user.middleName],
      lastName: [this.user.lastName, Validators.required],
      emailAddress: [this.user.emailAddress, [Validators.required, Validators.email]],
      mobileNumber: [this.user.mobileNumber, [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      username: [this.user.username ?? '', Validators.required],
      address: [this.user.address, Validators.required],
      password: [isUpdate ? '' : this.user.password ?? '', isUpdate ? [] : strongPasswordValidators()],
      passwordConfirm: [''],
      clinics: [assignedClinicIds(this.user)],
      role: [this.user.role, Validators.required],
      operatingHours: this.fb.array<FormGroup<RxOperatingHour>>(
        this.user.operatingHours.map(hour => this.createSchedule(hour.day, hour.startTime, hour.endTime))
      ),
    }, {
      validators: passwordMatchValidator('password', 'passwordConfirm')
    });

    applyPHMobilePrefix(this.mobileNumber);
    this.role.valueChanges.subscribe(() => this.syncRoleState());
    this.syncRoleState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clinics']) {
      this.buildUserFields();
    }
  }

  private buildUserFields(): void {
    const role = this.rxform?.controls.role.value ?? this.user.role;
    const fields: FormField[] = [
      { name: 'firstName', label: 'First Name', type: 'text' },
      { name: 'middleName', label: 'Middle Name', type: 'text' },
      { name: 'lastName', label: 'Last Name', type: 'text' },
      { name: 'emailAddress', label: 'Email Address', type: 'email' },
      {
        name: 'mobileNumber', label: 'Mobile Number', type: 'text', maxlength: 13,
        customError: 'Use +639 format and must be a valid Number'
      },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'username', label: 'Username', type: 'text' },
      { name: 'password', label: 'Password', type: 'password', customError: PASSWORD_REQUIREMENTS_MESSAGE },
      { name: 'passwordConfirm', label: 'Confirm Password', type: 'password', customError: 'Passwords must match.' },
      {
        name: 'role', label: 'Role', type: 'select', options: [
          { value: 'user', label: 'Patient' },
          { value: 'dentist', label: 'Dentist' },
          { value: 'admin', label: 'Admin' }
        ],
        customError: 'Select a role.'
      }
    ];

    if (role === 'dentist') {
      fields.push({
        name: 'clinics',
        label: 'Clinics',
        type: 'select',
        multiple: true,
        options: this.clinics
          .filter((clinic): clinic is Clinic & { _id: string } => !!clinic._id)
          .map(clinic => ({ value: clinic._id, label: clinic.name })),
        customError: 'Select at least one clinic.',
      });
    }

    this.userFields = this.user._id
      ? fields.filter(field => field.name !== 'password' && field.name !== 'passwordConfirm')
      : fields;
  }

  private syncRoleState(): void {
    if (this.role.value === 'dentist') {
      this.assignedClinics.setValidators(Validators.required);
    } else {
      this.assignedClinics.clearValidators();
    }
    this.assignedClinics.updateValueAndValidity({ emitEvent: false });
    this.buildUserFields();
  }

  onAddSchedule(): void {
    const usedDays = this.operatingHours.controls.map(group => group.controls.day.value);
    const nextDay = this.days.find(day => !usedDays.includes(day.code));

    if (!nextDay) return;

    const newGroup = this.fb.nonNullable.group({
      day: [nextDay.code, Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
    }, { validators: timeRangeValidator });

    this.operatingHours.push(newGroup);
  }

  private createSchedule(day: string, startTime: string, endTime: string): FormGroup<RxOperatingHour> {
    return this.fb.nonNullable.group({
      day: [day, Validators.required],
      startTime: [startTime, Validators.required],
      endTime: [endTime, Validators.required],
    });
  }

  isDayUsed(dayCode: string, currentIndex: number): boolean {
    return this.operatingHours.controls.some((group, index) =>
      index !== currentIndex && group.controls.day.value === dayCode
    );
  }

  getAvailableDays(currentIndex: number): Day[] {
    const selectedDays = this.operatingHours.controls
      .filter((_, index) => index !== currentIndex)
      .map(group => group.controls.day.value);

    return this.days.filter(day => !selectedDays.includes(day.code));
  }

  onSubmit(): void {
    if (this.rxform.invalid) {
      this.rxform.markAllAsTouched();
      return;
    }

    const user = buildStaffUserPayload({
      firstName: this.firstName.value,
      middleName: this.middleName.value,
      lastName: this.lastName.value,
      emailAddress: this.emailAddress.value,
      mobileNumber: this.mobileNumber.value,
      address: this.address.value,
      username: this.username.value,
      password: this.password.value,
      clinics: this.assignedClinics.value,
      operatingHours: this.operatingHours.getRawValue(),
      role: this.role.value,
    });

    this.onSubmitEvent.emit(user);
  }

  get firstName() { return this.rxform.controls.firstName; }
  get middleName() { return this.rxform.controls.middleName; }
  get lastName() { return this.rxform.controls.lastName; }
  get emailAddress() { return this.rxform.controls.emailAddress; }
  get mobileNumber() { return this.rxform.controls.mobileNumber; }
  get address() { return this.rxform.controls.address; }
  get username() { return this.rxform.controls.username; }
  get password() { return this.rxform.controls.password; }
  get role() { return this.rxform.controls.role; }
  get assignedClinics() { return this.rxform.controls.clinics; }
  get operatingHours() { return this.rxform.controls.operatingHours; }
}
