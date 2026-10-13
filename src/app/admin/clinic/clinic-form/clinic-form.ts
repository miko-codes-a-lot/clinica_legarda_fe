import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Clinic } from '../../../_shared/model/clinic';
import { RxClinicForm, RxClinicOperatingHour } from './rx-clinic-form';
import { timeRangeValidator } from '../../../utils/forms/form-custom-validator';
import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { Day } from '../../../_shared/model/day';
// for table component
import { FormComponent } from '../../../_shared/component/form/form.component';
import { MatFormFieldModule } from '@angular/material/form-field'; 
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';



@Component({
  selector: 'app-clinic-form',
  imports: [ReactiveFormsModule, FormComponent, MatFormFieldModule, MatSelectModule, MatInputModule],
  templateUrl: './clinic-form.html',
  styleUrl: './clinic-form.css'
})
export class ClinicForm implements OnInit {
  @Output() onSubmitEvent = new EventEmitter<Clinic>()
  @Input() isLoading = false
  @Input() days: Day[] = []
  @Input() clinic: Clinic = this.getDefaultClinic()

  rxform!: FormGroup<RxClinicForm>
  clinicFields: any[] = []; // <-- declare here
  private readonly destroyRef = inject(DestroyRef);

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
      dentists: [],
      // branches: []
    }
  }

  ngOnInit(): void {
    const operatingHours = this.clinic.operatingHours ?? [];
    const appointmentOnlyDays = this.clinic.appointmentOnlyDays ?? [];
    const dayCodes = [...new Set([...operatingHours.map(hour => hour.day), ...appointmentOnlyDays])];

    this.rxform = this.fb.nonNullable.group({
      name: [this.clinic.name, Validators.required],
      address: [this.clinic.address, Validators.required],
      mobileNumber: [this.clinic.mobileNumber, [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      emailAddress: [this.clinic.emailAddress, [Validators.required, Validators.email]],
      operatingHours: this.fb.array<FormGroup<RxClinicOperatingHour>>(dayCodes.map(day => {
        const fixed = operatingHours.find(hour => hour.day === day);
        const byAppointment = appointmentOnlyDays.includes(day);
        const hour = this.fb.nonNullable.group({
          day: [day, Validators.required],
          byAppointment: [byAppointment],
          startTime: this.fb.nonNullable.control({ value: fixed?.startTime ?? '', disabled: byAppointment }, Validators.required),
          endTime: this.fb.nonNullable.control({ value: fixed?.endTime ?? '', disabled: byAppointment }, Validators.required),
        }, { validators: group => group.get('byAppointment')?.value ? null : timeRangeValidator(group) });
        hour.controls.byAppointment.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(appointmentOnly => {
          if (appointmentOnly) {
            hour.controls.startTime.disable({ emitEvent: false });
            hour.controls.endTime.disable({ emitEvent: false });
          } else {
            hour.controls.startTime.enable({ emitEvent: false });
            hour.controls.endTime.enable({ emitEvent: false });
          }
          hour.updateValueAndValidity();
        });
        return hour;
      })),
    })

    // change the format to E.164    
    const mobileNumber = this.rxform.get('mobileNumber');
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }

    this.buildClinicFields();
  }

  
  private buildClinicFields() {
    this.clinicFields = [
      { name: 'name', label: 'Name', type: 'text'},
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', customError: 'Use +639 format only'  },
      { name: 'emailAddress', label: 'Email Address', type: 'email' },
    ];
      // remove password validation and input on Update
  }

  onSubmit() {
    if (this.rxform.invalid) { this.rxform.markAllAsTouched(); return; }
    const clinic: Clinic = {
      name: this.name.value,
      address: this.address.value,
      emailAddress: this.emailAddress.value,
      mobileNumber: this.mobileNumber.value,
      operatingHours: this.operatingHours.controls.filter(hour => !hour.controls.byAppointment.value).map((o) => ({
        day: o.controls.day.value,
        startTime: o.controls.startTime.value,
        endTime: o.controls.endTime.value,
      })),
      appointmentOnlyDays: this.operatingHours.controls.filter(hour => hour.controls.byAppointment.value).map(hour => hour.controls.day.value),
      dentists: [],
      // branches: []
    }
    this.onSubmitEvent.emit(clinic)
  }

  // check selected day filter
  getDayOptions(index: number): Day[] {
    const selectedCode = this.operatingHours.at(index).get('day')?.value;
    return this.days.filter(day => day.code === selectedCode);
  }

  dayLabel(dayCode: string): string {
    return this.days.find(day => day.code === dayCode)?.label ?? dayCode.charAt(0).toUpperCase() + dayCode.slice(1);
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
