import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
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
  @Output() onSubmitEvent = new EventEmitter<AppointmentPayload>();
  @Input() isLoading = false;
  @Input() clinics: Clinic[] = [];
  @Input() appointment!: Appointment;
  @Input() dentalServices: DentalService[] = [];
  @Input() patients: User[] = [];

  dentists: User[] = [];
  selectedDentist?: User;

  rxform!: FormGroup<RxAppointmentForm>;
  appointmentFields: any[] = [];

  minDate = new Date();
  maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

  isEditMode = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
      private cdr: ChangeDetectorRef
    
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.appointment;

    const clinicId = this.appointment?.clinic?._id || '';
    const dentistId = this.appointment?.dentist?._id || '';

    // Initialize reactive form
    this.rxform = this.fb.nonNullable.group({
      clinic: [clinicId, Validators.required],
      dentist: [dentistId, Validators.required],
      patient: [this.appointment?.patient?._id || '', Validators.required],
      services: [this.appointment?.services.map(s => s._id || '') || [] as string[], Validators.required],
      date: [this.appointment?.date ? new Date(this.appointment.date) : new Date(), Validators.required],
      time: [this.appointment?.startTime || '', Validators.required],
      patientNotes: [this.appointment?.notes?.patientNotes || '']
    });

    // Load dentists and set selected dentist + patch date/time if edit mode
    this.loadDentists(clinicId, dentistId);

    // Listen to clinic changes
    this.clinic.valueChanges.subscribe((clinicId: string) => {
      this.loadDentists(clinicId);
      if (!this.isEditMode) this.clearDateTime();
    });

    // Listen to dentist changes
    this.dentist.valueChanges.subscribe(() => {
      if (!this.isEditMode) this.clearDateTime();
    });

    // Only clear time when creating a new appointment
    if (!this.isEditMode) {
      this.date.valueChanges.subscribe(() => this.time.setValue(''));
    }

    this.buildAppointmentFields();
  }

  private loadDentists(clinicId: string, dentistId?: string) {
    const clinic = this.clinics.find(c => c._id === clinicId);
    if (!clinic) return;

    this.userService.getAll().subscribe(users => {
      this.dentists = users.filter(u => u.clinic === clinic._id);

      if (dentistId) {
        this.selectedDentist = this.dentists.find(d => d._id === dentistId);
      } else {
        this.selectedDentist = undefined;
      }

      // Patch date/time after dentists are loaded
      if (this.isEditMode) {
        setTimeout(() => {
          this.rxform.patchValue({
            date: this.appointment.date ? new Date(this.appointment.date) : new Date(),
            time: this.appointment.startTime || ''
          });
        });
        this.cdr.detectChanges(); // force re-render
      }

      this.buildAppointmentFields();
    });
  }

  private setDentist(dentistId: string) {
    this.selectedDentist = this.dentists.find(d => d._id === dentistId);
  }

  private clearDateTime() {
    this.date.setValue(new Date());
    this.time.setValue('');
  }

  private buildAppointmentFields() {
    const filteredPatients = this.patients.filter(p => p.role === 'user');
    const customPatients = this.setUsersKey(filteredPatients);
    const customDentists = this.setUsersKey(this.dentists);

    const selectClinic = this.mapToOptions(this.clinics);
    const selectDentist = this.mapToOptions(customDentists);
    const selectPatient = this.mapToOptions(customPatients);
    const selectDentalService = this.mapToOptions(this.dentalServices);

    this.appointmentFields = [
      { name: 'clinic', label: 'Clinic', type: 'select', options: selectClinic },
      { name: 'patient', label: 'Patient', type: 'select', options: selectPatient },
      { name: 'services', label: 'Services', type: 'select', options: selectDentalService, multiple: true },
      {
        name: 'patientNotes',
        label: 'Notes for Dentist',
        type: 'textarea',
        placeholder: 'Write any notes or concerns for your dentist here...',
      }
    ];
  }

  private setUsersKey(items: { firstName: string; lastName: string }[]) {
    return items.map(item => ({ ...item, name: `${item.firstName} ${item.lastName}` }));
  }

  private mapToOptions(items: { _id?: string; name: string }[]): { value: string; label: string }[] {
    return items.map(item => ({ value: item._id ?? '', label: item.name }));
  }

  serviceDuration(): number {
    return Math.max(30, this.services.value.reduce((total, serviceId) => {
      const service = this.dentalServices.find(d => d._id === serviceId);
      return total + (service?.duration || 0);
    }, 0));
  }

  getFormattedDuration(): string {
    const totalMinutes = this.serviceDuration();
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    if (minutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

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

    const appointmentData: AppointmentPayload = {
      clinic: this.clinic.value ?? '',
      dentist: this.dentist.value,
      patient: this.patient.value,
      services: this.services.value,
      date: this.date.value,
      startTime,
      endTime,
      status: AppointmentStatus.PENDING,
      notes: {
        clinicNotes: '',
        patientNotes: this.rxform.controls.patientNotes.value || ''
      }
    };

    this.onSubmitEvent.emit(appointmentData);
  }

  get clinic() { return this.rxform.controls.clinic; }
  get dentist() { return this.rxform.controls.dentist; }
  get patient() { return this.rxform.controls.patient; }
  get services() { return this.rxform.controls.services; }
  get date() { return this.rxform.controls.date; }
  get time() { return this.rxform.controls.time; }
}
