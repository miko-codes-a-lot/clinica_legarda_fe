import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentPayload } from '../appointment-payload';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { User } from '../../../_shared/model/user';
import { RxAppointmentForm } from './rx-appointment-form';
import { DentalService } from '../../../_shared/model/dental-service';
import { FormControlErrorsComponent } from '../../../_shared/component/form-control-errors/form-control-errors.component';
import { Clinic } from '../../../_shared/model/clinic';
import { DatePicker } from '../../../_shared/component/date-picker/date-picker';

@Component({
  selector: 'app-appointment-form',
  imports: [
    ReactiveFormsModule,
    FormControlErrorsComponent,
    DatePicker,
  ],
  templateUrl: './appointment-form.html',
  styleUrl: './appointment-form.css'
})
export class AppointmentForm {
  @Output() onSubmitEvent = new EventEmitter<AppointmentPayload>()
  @Input() isLoading = false
  @Input() clinics: Clinic[] = []
  @Input() appointment!: Appointment
  @Input() dentalServices: DentalService[] = []
  @Input() patients: User[] = []

  dentists: User[] = []
  selectedDentist?: User

  rxform!: FormGroup<RxAppointmentForm>

  minDate = new Date()
  maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now only

  constructor(private readonly fb: FormBuilder) {}

  private changeDentists(clinicId: string) {
    const clinic = this.clinics.find(c => c._id == clinicId)
    if (!clinic) return

    this.dentists = clinic.dentists
  }

  private setDentist(dentistId: string) {
    const dentist = this.dentists.find(d => d._id == dentistId)
    if (!dentist) return

    this.selectedDentist = dentist
  }

  ngOnInit(): void {
    const clinicId = this.appointment.clinic._id || ''
    const dentistId = this.appointment.dentist._id || ''

    this.rxform = this.fb.nonNullable.group({
      clinic: [clinicId, Validators.required],
      dentist: [dentistId, Validators.required],
      patient: [this.appointment.patient._id || '', Validators.required],
      services: [this.appointment.services.map(s => s._id || ''), Validators.required],
      date: [this.appointment.date, Validators.required]
    })

    this.changeDentists(clinicId)
    this.setDentist(dentistId)

    this.clinic.valueChanges.subscribe({
      next: (v) => {
        this.changeDentists(v)
      }
    })

    this.dentist.valueChanges.subscribe({
      next: (d) => {
        this.setDentist(d)
      }
    })
  }

  onSubmit() {
    const appointment: AppointmentPayload = {
      dentist: this.dentist.value,
      patient: this.patient.value,
      services: this.services.value,
      date: this.date.value,
      status: AppointmentStatus.PENDING,
      notes: {
        clinicNotes: '',
        patientNotes: '',
      },
      history: []
    }

    this.onSubmitEvent.emit(appointment)
  }

  get clinic() {
    return this.rxform.controls.clinic
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
