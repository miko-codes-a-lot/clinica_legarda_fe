import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Clinic } from '../../../_shared/model/clinic';
import { RxClinicForm, RxOperatingHour } from './rx-clinic-form';

@Component({
  selector: 'app-clinic-form',
  imports: [ReactiveFormsModule],
  templateUrl: './clinic-form.html',
  styleUrl: './clinic-form.css'
})
export class ClinicForm implements OnInit {
  @Output() onSubmitEvent = new EventEmitter<Clinic>()
  @Input() isLoading = false
  @Input() clinic: Clinic = this.getDefaultClinic()

  rxform!: FormGroup<RxClinicForm>

  days = [
    { label: 'Monday', code: 'monday', },
    { label: 'Tuesday', code: 'tuesday', },
    { label: 'Wednesday', code: 'wednesday', },
    { label: 'Thursday', code: 'thursday', },
    { label: 'Friday', code: 'friday', },
    { label: 'Saturday', code: 'saturday', },
    { label: 'Sunday', code: 'sunday', },
  ]

  constructor(private readonly fb: FormBuilder) {}

  getDefaultClinic(): Clinic {
    return {
      name: '',
      address: '',
      mobileNumber: '',
      emailAddress: '',
      operatingHours: [
        { day: 'monday', startTime: '09:00', endTime: '18:00' },
        { day: 'tuesday', startTime: '09:00', endTime: '18:00' },
        { day: 'wednesday', startTime: '09:00', endTime: '18:00' },
        { day: 'thursday', startTime: '09:00', endTime: '18:00' },
        { day: 'friday', startTime: '09:00', endTime: '18:00' },
        { day: 'saturday', startTime: '10:00', endTime: '15:00' },
        { day: 'sunday', startTime: '10:00', endTime: '15:00' },
      ],
      branches: []
    }
  }

  ngOnInit(): void {
    const operatingHours = this.clinic.operatingHours.length == 0
      ? this.getDefaultClinic().operatingHours
      : this.clinic.operatingHours

    this.rxform = this.fb.nonNullable.group({
      name: [this.clinic.name, Validators.required],
      address: [this.clinic.address, Validators.required],
      mobileNumber: [this.clinic.mobileNumber, Validators.required],
      emailAddress: [this.clinic.emailAddress, Validators.required],
      operatingHours: this.fb.array<FormGroup<RxOperatingHour>>(
        this.clinic.operatingHours.map(
          (o) => this.fb.nonNullable.group({
            day: [o.day, Validators.required],
            startTime: [o.startTime, Validators.required],
            endTime: [o.endTime, Validators.required]
          })
        )
      ),
    })
  }

  onSubmit() {
    const clinic: Clinic = {
      name: this.name.value,
      address: this.address.value,
      emailAddress: this.emailAddress.value,
      mobileNumber: this.mobileNumber.value,
      operatingHours: this.operatingHours.controls.map((o) => ({
        day: o.controls.day.value,
        startTime: o.controls.startTime.value,
        endTime: o.controls.endTime.value,
      })),
      branches: []
    }

    this.onSubmitEvent.emit(clinic)
  }

  get name() {
    return this.rxform.controls.name
  }

  get address() {
    return this.rxform.controls.address
  }

  get emailAddress() {
    return this.rxform.controls.emailAddress
  }

  get mobileNumber() {
    return this.rxform.controls.mobileNumber
  }

  get operatingHours() {
    return this.rxform.controls.operatingHours
  }
}
