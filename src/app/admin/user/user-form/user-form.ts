import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RxUserForm } from './rx-user-form.interface';
import { User } from '../../../_shared/model/user';
import { FormControlErrorsComponent } from '../../../_shared/component/form-control-errors/form-control-errors.component';
import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { RxOperatingHour } from '../../../_shared/model/reactive/rx-operating-hours';
import { Day } from '../../../_shared/model/day';
import { MyValidators } from '../../../utils/forms/form-custom-validator';
import { Clinic } from '../../../_shared/model/clinic';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, FormControlErrorsComponent],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm implements OnInit {
  @Output() onSubmitEvent = new EventEmitter<User>()
  @Input() isLoading = false
  @Input() clinics: Clinic[] = []
  @Input() user: User = this.getDefaultUser()

  rxform!: FormGroup<RxUserForm>

  @Input() days: Day[] = []

  constructor(private readonly fb: FormBuilder) {}

  getDefaultUser(): User {
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      emailAddress: '',
      mobileNumber: '',
      address: '',
      password: '',
      clinic: '',
      branch: '',
      role: 'patient',
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
    this.rxform = this.fb.nonNullable.group({
      firstName: [this.user.firstName, Validators.required],
      middleName: [this.user.middleName],
      lastName: [this.user.lastName, Validators.required],
      emailAddress: [this.user.emailAddress, [Validators.required, Validators.email]],
      mobileNumber: [this.user.mobileNumber, [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      address: [this.user.address, Validators.required],
      password: [''],
      passwordConfirm: [''],
      clinic: [this.user.clinic],
      branch: [this.user.branch],
      role: [this.user.role, Validators.required],
      operatingHours: this.fb.array<FormGroup<RxOperatingHour>>(
        this.user.operatingHours.map(
          (o) => this.fb.nonNullable.group(
            {
              day: [o.day, Validators.required],
              startTime: [o.startTime, Validators.required],
              endTime: [o.endTime, Validators.required]
            },
            {
              validators: MyValidators.timeRangeValidator
            }
          )
        )
      ),
    }, {
      validators: MyValidators.passwordMatchValidator('password', 'passwordConfirm')
    })

    // change the format to E.164    
    const mobileNumber = this.rxform.get('mobileNumber');
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }
  }

  onAddSchedule() {
    this.operatingHours.push(
      this.fb.nonNullable.group({
        day: ['monday'],
        startTime: ['09:00'],
        endTime: ['18:00'],
      })
    )
  }

  onSubmit() {
    const operatingHours = this.operatingHours.value.map((oh) => ({
      day: oh.day ?? '',
      startTime: oh.startTime ?? '',
      endTime: oh.endTime ?? '',
    }))

    const user: User = {
      firstName: this.firstName.value,
      middleName: this.middleName.value,
      lastName: this.lastName.value,
      emailAddress: this.emailAddress.value,
      mobileNumber: this.mobileNumber.value,
      address: this.address.value,
      password: this.password.value,
      clinic: this.clinic.value,
      branch: this.clinic.value,
      operatingHours: this.role.value === 'dentist' ? operatingHours : [],
      role: this.role.value,
    }

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
