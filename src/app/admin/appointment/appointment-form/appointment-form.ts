import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppointmentPayload } from '../appointment-payload';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { User } from '../../../_shared/model/user';
import { RxAppointmentForm } from './rx-appointment-form';

@Component({
  selector: 'app-appointment-form',
  imports: [ReactiveFormsModule],
  templateUrl: './appointment-form.html',
  styleUrl: './appointment-form.css'
})
export class AppointmentForm {
  @Output() onSubmitEvent = new EventEmitter<AppointmentPayload>()
  @Input() isLoading = false
  @Input() appointment!: Appointment
  @Input() patients: User[] = []
  @Input() dentists: User[] = []

  rxform!: FormGroup<RxAppointmentForm>

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.rxform = this.fb.nonNullable.group({
      dentist: [this.appointment.dentist._id || ''],
      patient: [this.appointment.patient._id || ''],
      services: [this.appointment.services.map(s => s._id || '')],
      date: [this.appointment.date.toISOString()]
    })
  }

  onSubmit() {
    const appointment: AppointmentPayload = {
      dentist: this.dentist.value,
      patient: this.patient.value,
      services: this.services.value,
      date: new Date(this.date.value),
      status: AppointmentStatus.PENDING,
      notes: {
        clinicNotes: '',
        patientNotes: '',
      },
      history: []
    }

    this.onSubmitEvent.emit(appointment)
  }

  get dentist() {
    return this.rxform.controls.dentist
  }

  get patient() {
    return this.rxform.controls.patient
  }

  get services() {
    return this.rxform.controls.services
  }

  get date() {
    return this.rxform.controls.date
  }
}
