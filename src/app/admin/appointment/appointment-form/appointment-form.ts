import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentPayload } from '../appointment-payload';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { User } from '../../../_shared/model/user';
import { RxAppointmentForm } from './rx-appointment-form';
import { DentalService } from '../../../_shared/model/dental-service';
import { Clinic } from '../../../_shared/model/clinic';
import { DatePicker } from '../../../_shared/component/date-picker/date-picker';
import { TimePicker } from '../../../_shared/component/time-picker/time-picker';
import { TimeUtil } from '../../../utils/time-util';
import { UserService } from '../../../_shared/service/user-service';


import { FormComponent } from '../../../_shared/component/form/form.component';


@Component({
  selector: 'app-appointment-form',
  imports: [
    ReactiveFormsModule,
    TimePicker,
    DatePicker,
    FormComponent
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
  appointmentFields: any[] = [];

  minDate = new Date()
  maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now only

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService // inject here
  ) {}

  private clearDateTime() {
    this.date.setValue(new Date())
    this.time.setValue('')
  }

  private changeDentists(clinicId: string) {
    const clinic = this.clinics.find(c => c._id == clinicId)
 
    if (!clinic) return

    this.userService.getAll().subscribe(users => {
      // filter dentists by clinic
      this.dentists = users.filter(u => u.clinic === clinic?._id)
      this.builAppointmentFields();
    })

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
      time: [this.appointment.startTime, Validators.required],
      patientNotes: [this.appointment.notes?.patientNotes || '']
    })
    this.changeDentists(clinicId)
    this.setDentist(dentistId)
    this.clinic.valueChanges.subscribe({
      next: (v) => {
        this.changeDentists(v)
        this.clearDateTime()
      }
    })
    this.dentist.valueChanges.subscribe({
      next: (d) => {
        this.setDentist(d)
        this.clearDateTime()
      }
    })
    this.date.valueChanges.subscribe({
      next: (v) => {
        this.time.setValue('')
      }
    })
    this.builAppointmentFields();
  }

  private builAppointmentFields() {
    this.patients = this.patients.filter((p) => p.role === 'user');
    const customeSelectPatient = this.setUsersKey(this.patients)
    const customSelectDentist = this.setUsersKey(this.dentists)
    const selectClinic = this.maptoOptions(this.clinics)
    const selectDentist = this.maptoOptions(customSelectDentist)
    const selectPatient = this.maptoOptions(customeSelectPatient)
    const selectDentalService = this.maptoOptions(this.dentalServices)
    this.appointmentFields = [
      { name: 'clinic', label: 'Clinic', type: 'select', options: selectClinic},
      { name: 'patient', label: 'Patient', type: 'select', options: selectPatient},
      { name: 'services', label: 'Services', type: 'select', options: selectDentalService, multiple: true},
      // { name: 'patient', label: 'Patient', type: 'select', options: selectPatient},
    ];
    // push the object inside the array if the clinic is selected
    if (this.dentists.length !== 0) {
      this.appointmentFields.splice(1, 0, { 
        name: 'dentist', label: 'Dentist', type: 'select', options: selectDentist
      })

      this.appointmentFields.splice(6, 0, {
        name: 'patientNotes',
        label: 'Notes for Dentist',
        type: 'textarea',
        placeholder: 'Write any notes or concerns for your dentist here...',
      });
    }

  }

  setUsersKey (items: {firstName: string; lastName: string}[]) {
      return items.map((item) => ({
      ...item,
      name: item.firstName + ' ' + item.lastName
    }))
  }
  maptoOptions (items: {_id?: string; name: string}[]): {value: string; label: string}[] {
    return items.map(item => ({
      value: item._id ?? '',
      label: item.name,
    }))
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


    const appointmentData = {
      clinic: this.clinic.value ?? '',
      dentist: this.dentist.value,
      patient: this.patient.value,
      services: this.services.value,
      date: this.date.value,
      startTime: this.time.value, // 11:00 for example
      endTime: endTime, // here we need to add all the total duration and it will become the end time
      status: AppointmentStatus.PENDING,
      notes: {
        clinicNotes: '',
        patientNotes: this.rxform.controls.patientNotes.value || '',
      },
      // history: []
    }
    const appointment: AppointmentPayload = appointmentData;
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
