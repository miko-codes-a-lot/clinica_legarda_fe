import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RxUserForm } from './rx-user-form.interface';
import { User } from '../../../_shared/model/user';
import { FormControlErrorsComponent } from '../../../_shared/component/form-control-errors/form-control-errors.component';
import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { RxOperatingHour } from '../../../_shared/model/reactive/rx-operating-hours';
import { Day } from '../../../_shared/model/day';
import { MyValidators, timeRangeValidator, withinClinicHoursValidator } from '../../../utils/forms/form-custom-validator';
import { Clinic } from '../../../_shared/model/clinic';
import { UserPayload } from './user-payload';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, FormControlErrorsComponent],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm implements OnInit {
  @Output() onSubmitEvent = new EventEmitter<UserPayload>()
  @Input() isLoading = false
  @Input() clinics: Clinic[] = []
  @Input() user: User = this.getDefaultUser()

  rxform!: FormGroup<RxUserForm>

  @Input() days: Day[] = []

  constructor(private readonly fb: FormBuilder) {}

  // Global Variable
  selectedClinic: Clinic | undefined;
  indexToPush = 0;

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
        branches: []
      },
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
      validators: MyValidators.passwordMatchValidator('password', 'passwordConfirm')
    })

    // change the format to E.164    
    const mobileNumber = this.rxform.get('mobileNumber');
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }
  }
  onClinicChange(event: Event) {
    const selectedId = (event.target as HTMLSelectElement).value;

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

    const user: UserPayload = {
      firstName: this.firstName.value,
      middleName: this.middleName.value,
      lastName: this.lastName.value,
      emailAddress: this.emailAddress.value,
      mobileNumber: this.mobileNumber.value,
      address: this.address.value,
      password: this.password.value,
      clinic: this.clinic.value,
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
