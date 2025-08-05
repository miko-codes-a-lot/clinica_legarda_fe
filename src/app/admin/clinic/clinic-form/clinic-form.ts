import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Clinic } from '../../../_shared/model/clinic';
import { RxClinicForm } from './rx-clinic-form';
import { MyValidators } from '../../../utils/forms/form-custom-validator';
import { FormControlErrorsComponent } from '../../../_shared/component/form-control-errors/form-control-errors.component';
import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { RxOperatingHour } from '../../../_shared/model/reactive/rx-operating-hours';
import { Day } from '../../../_shared/model/day';

@Component({
  selector: 'app-clinic-form',
  imports: [ReactiveFormsModule, FormControlErrorsComponent],
  templateUrl: './clinic-form.html',
  styleUrl: './clinic-form.css'
})
export class ClinicForm implements OnInit {
  @Output() onSubmitEvent = new EventEmitter<Clinic>()
  @Input() isLoading = false
  @Input() clinic: Clinic = this.getDefaultClinic()
  @Input() days: Day[] = []

  rxform!: FormGroup<RxClinicForm>

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
      mobileNumber: [this.clinic.mobileNumber, [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      emailAddress: [this.clinic.emailAddress, [Validators.required, Validators.email]],

      operatingHours: this.fb.array<FormGroup<RxOperatingHour>>(
        this.clinic.operatingHours.map(
          (o) => this.fb.nonNullable.group({
            day: [o.day, Validators.required],
            startTime: [o.startTime, Validators.required],
            endTime: [o.endTime, Validators.required]
          }, {validators: MyValidators.timeRangeValidator})
        )
      ),
    })

    // change the format to E.164    
    const mobileNumber = this.rxform.get('mobileNumber');
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }

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

  // check selected day filter
  getDayOptions(index: number): any[] {
    const selectedCode = this.operatingHours.at(index).get('day')?.value;
    return this.days.filter(day => day.code === selectedCode);
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
