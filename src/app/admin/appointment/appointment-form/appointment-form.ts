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
import { TimePicker } from '../../../_shared/component/time-picker/time-picker';
import { TimeUtil } from '../../../utils/time-util';

@Component({
  selector: 'app-appointment-form',
  imports: [
    ReactiveFormsModule,
    FormControlErrorsComponent,
    TimePicker,
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
      date: [this.appointment.date, Validators.required],
      time: ['', Validators.required]
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

  serviceDuration() {
    const totalDuration = this.services.value.reduce((p, c) => {
      const service = this.dentalServices.find(d => d._id == c)!
      return p + service.duration
    }, 0)
    return Math.max(30, totalDuration)
  }
  
  /** Total duration: 30 minutes */
  getFormattedDuration(): string {
    const totalMinutes = this.serviceDuration();
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  /** Time: 11:00 AM - 11:30 AM */
  getAppointmentTimeRange(): string {
    if (!this.time.value) return '';
    
    const startTime = this.time.value;
    const endTime = TimeUtil.calculateEndTime(startTime, this.serviceDuration());
    
    return `${this.formatTimeDisplay(startTime)} - ${this.formatTimeDisplay(endTime)}`;
  }

  private formatTimeDisplay(timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  onSubmit() {
    const duration = this.serviceDuration();
    const startTime = this.time.value;
    const endTime = TimeUtil.calculateEndTime(startTime, duration);

    const appointment: AppointmentPayload = {
      dentist: this.dentist.value,
      patient: this.patient.value,
      services: this.services.value,
      date: this.date.value,
      startTime: this.time.value, // 11:00 for example
      endTime: endTime, // here we need to add all the total duration and it will become the end time
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

  get time() {
    return this.rxform.controls.time
  }
}
