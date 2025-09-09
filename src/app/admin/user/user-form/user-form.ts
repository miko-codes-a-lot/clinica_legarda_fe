import { Component, EventEmitter, Input, OnInit, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RxUserForm } from './rx-user-form.interface';
import { User } from '../../../_shared/model/user';
import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { RxOperatingHour } from '../../../_shared/model/reactive/rx-operating-hours';
import { Day } from '../../../_shared/model/day';
import { passwordMatchValidator, timeRangeValidator, withinClinicHoursValidator } from '../../../utils/forms/form-custom-validator';
import { Clinic } from '../../../_shared/model/clinic';
import { UserPayload } from './user-payload';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field'; // to remove
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormComponent } from '../../../_shared/component/form/form.component';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule, FormComponent],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm implements OnInit, OnChanges {
  @Output() onSubmitEvent = new EventEmitter<UserPayload>()
  @Input() isLoading = false
  @Input() clinics: Clinic[] = []
  @Input() user: User = this.getDefaultUser()

  rxform!: FormGroup<RxUserForm>
  fields: any[] = []; // <-- declare here
  userFields: any[] = []; // <-- declare here

  @Input() days: Day[] = []

  constructor(private readonly fb: FormBuilder) {}

  // Global Variable
  selectedClinic: Clinic | undefined;
  indexToPush = 0;
  hide = signal(true);

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  initialUser = { firstName: '', lastName: '', emailAddress: '', mobileNumber: '', role: 'patient' };

  getDefaultUser(): User {
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      emailAddress: '',
      mobileNumber: '',
      address: '',
      password: '',
      clinic: {
        name: '',
        address: '',
        mobileNumber: '',
        emailAddress: '',
        operatingHours: [],
        dentists: [],
      },
      role: 'patient',
      appointments: [],
      operatingHours: [
        // { day: 'monday', startTime: '09:00', endTime: '18:00' },
        // { day: 'tuesday', startTime: '09:00', endTime: '18:00' },
        // { day: 'wednesday', startTime: '09:00', endTime: '18:00' },
        // { day: 'thursday', startTime: '09:00', endTime: '18:00' },
        // { day: 'friday', startTime: '09:00', endTime: '18:00' },
        // { day: 'saturday', startTime: '10:00', endTime: '15:00' },
        // { day: 'sunday', startTime: '10:00', endTime: '15:00' },
      ],
    }
  }

  ngOnInit(): void {
    this.buildUserFields();
    this.rxform = this.fb.nonNullable.group({
      firstName: [this.user.firstName, Validators.required],
      middleName: [this.user.middleName],
      lastName: [this.user.lastName, Validators.required],
      emailAddress: [this.user.emailAddress, [Validators.required, Validators.email]],
      mobileNumber: [this.user.mobileNumber, [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      address: [this.user.address, Validators.required],
      password: [this.user.password ?? '', Validators.required],
      passwordConfirm: [''],
      clinic: [this.user.clinic?._id],
      role: [this.user.role, Validators.required],
      operatingHours: this.fb.array<FormGroup<RxOperatingHour>>(
        this.user.operatingHours.map(
          (o) => this.fb.nonNullable.group(
            {
              day: [o.day, Validators.required],
              startTime: [o.startTime, Validators.required],
              endTime: [o.endTime, Validators.required]
            }
          )
        )
      ),
    }, {
      validators: passwordMatchValidator('password', 'passwordConfirm')
    })
    // change the format to E.164    
    const mobileNumber = this.rxform.get('mobileNumber');
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }

    // React to role change
    this.rxform.get('role')?.valueChanges.subscribe(role => {
      if (role === 'dentist') {
        // add if not already in the list
        if (!this.userFields.find(f => f.name === 'clinic')) {
          this.userFields.push({
            name: 'clinic',
            label: 'Clinic',
            type: 'select',
            options: this.clinics.map(c => ({ value: c._id, label: c.name })),
            customError: 'Select a clinic.',
            selectionChange: (event: any) => this.onClinicChange(event)
          });

          (this.rxform as any).addControl('clinic', this.fb.control('', Validators.required));
        }
      } else {
        // remove if exists
        this.userFields = this.userFields.filter(f => f.name !== 'clinic');
        if (this.rxform.get('clinic')) {
          (this.rxform as any).removeControl('clinic');
        }
      }

    });
    // remove here the password and confirm password
    if (this.user?._id && this.rxform.contains('password')) {
      (this.rxform as any).removeControl('password');
      (this.rxform as any).removeControl('passwordConfirm');
    }

    this.buildUserFields();

  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clinics']) {
      this.buildUserFields();
    }
  }

  private buildUserFields() {
    this.userFields = [
      { name: 'firstName', label: 'First Name', type: 'text'},
      { name: 'middleName', label: 'Middle Name', type: 'text' },
      { name: 'lastName', label: 'Last Name', type: 'text' },
      { name: 'emailAddress', label: 'Email Address', type: 'email' },
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', customError: 'Use +639 format only' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'passwordConfirm', label: 'Confirm Password', type: 'password', customError: 'Passwords must match.' },
      { name: 'role', label: 'Role', type: 'select', options: [
          { value: 'patient', label: 'Patient' },
          { value: 'dentist', label: 'Dentist' },
          { value: 'admin', label: 'Admin' }
        ],
        customError: 'Select a clinic.'
      }
    ];

        // remove password validation and input on Update
    if (this.user?._id) {
      this.userFields = this.userFields.filter(
        f => f.name !== 'password' && f.name !== 'passwordConfirm'
      );
    }
  }

  onClinicChange(event: MatSelectChange): void {
    const selectedId = event.value;
    const selectedClinicData = this.clinics.find(c => c._id === selectedId);
    this.selectedClinic = selectedClinicData;
  }

  onAddSchedule() {
    const usedDays = this.operatingHours.controls.map(group => group.get('day')?.value);

    // Find the next schedule with an unused day
    if (this.selectedClinic?.operatingHours) {
      const nextSchedule = this.selectedClinic.operatingHours.find(
        sched => !usedDays.includes(sched.day)
      );

      if (nextSchedule) {
        const newGroup = this.fb.nonNullable.group({
            day: [{ value: nextSchedule.day, disabled: usedDays.includes(nextSchedule.day) }],
            startTime: [nextSchedule.startTime],
            endTime: [nextSchedule.endTime],
          }, { validators: [
            timeRangeValidator,
            withinClinicHoursValidator(this.selectedClinic.operatingHours)
          ] });

        // Subscribe to day changes for dynamic updates
        newGroup.get('day')?.valueChanges.subscribe((selectedDay: string) => {
          const defaultSchedule = this.selectedClinic?.operatingHours?.find(d => d.day === selectedDay);
          if (defaultSchedule) {
            newGroup.get('startTime')?.setValue(defaultSchedule.startTime);
            newGroup.get('endTime')?.setValue(defaultSchedule.endTime);
          }
        });

        this.operatingHours.push(newGroup);
      }
    }
  }

  isDayUsed(dayCode: string, currentIndex: number): boolean {
    return this.operatingHours.controls.some((group, i) => {
      return i !== currentIndex && group.get('day')?.value === dayCode;
    });
  }

  getAvailableDays(currentIndex: number) {
    const selectedDays = this.operatingHours.controls
      .map((group, i) => i !== currentIndex ? group.get('day')?.value : null)
      .filter(day => !!day);

    return this.days.filter(day => !selectedDays.includes(day.code));
  }

  onSubmit() {
    const operatingHours = this.operatingHours.value.map((oh) => ({
      day: oh.day ?? '',
      startTime: oh.startTime ?? '',
      endTime: oh.endTime ?? '',
    }))

    const userData = {
      firstName: this.firstName.value,
      middleName: this.middleName.value,
      lastName: this.lastName.value,
      emailAddress: this.emailAddress.value,
      mobileNumber: this.mobileNumber.value,
      address: this.address.value,
      password: this.password?.value,
      clinic: this.clinic.value,
      operatingHours: this.role.value === 'dentist' ? operatingHours : [],
      role: this.role.value,
    }

    if(!this.password?.value){
      delete (userData as any).password; // This removes the password field from the object on update
    }

    const user: UserPayload = userData;

    this.onSubmitEvent.emit(user)
  }

  get firstName() {
    return this.rxform.controls.firstName
  }

  get middleName() {
    return this.rxform.controls.middleName
  }

  get lastName() {
    return this.rxform.controls.lastName
  }

  get emailAddress() {
    return this.rxform.controls.emailAddress
  }

  get mobileNumber() {
    return this.rxform.controls.mobileNumber
  }

  get address() {
    return this.rxform.controls.address
  }

  get password() {
    return this.rxform.controls.password
  }

  get role() {
    return this.rxform.controls.role
  }

  get clinic() {
    return this.rxform.controls.clinic
  }

  get operatingHours() {
    return this.rxform.controls.operatingHours
  }
}
