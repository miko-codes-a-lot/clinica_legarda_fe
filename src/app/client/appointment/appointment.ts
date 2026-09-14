import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { bookingSlots, DentistBookingSchedule, isBookableDentist, pickerDateFromStored } from '../../_shared/model/booking-availability';
import { BookingAvailabilityService } from '../../_shared/service/booking-availability-service';
import { Component, EventEmitter, Input, Output, DestroyRef, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentPayload } from '../../admin/appointment/appointment-payload';
import { ReferralPayload } from '../../admin/appointment/referral-payload';
import { Appointment, AppointmentStatus } from '../../_shared/model/appointment';
import { isPreviousTreatment } from '../../_shared/model/appointment-history';
import { DentistDirectoryEntry } from '../../_shared/model/user-directory';
import { RxAppointmentForm } from './rx-appointment-form';
import { RxReferralForm } from './rx-referral-form';
import { DentalService } from '../../_shared/model/dental-service';
import { Clinic } from '../../_shared/model/clinic';
import { DatePicker } from '../../_shared/component/date-picker/date-picker';
import { TimePicker } from '../../_shared/component/time-picker/time-picker';
import { TimeUtil } from '../../utils/time-util';
import { AuthService } from '../../_shared/service/auth-service';
import { FormComponent } from '../../_shared/component/form/form.component';

import { RouterLink } from '@angular/router';
import { UserSimple } from '../../_shared/model/user-simple';
import { UserService } from '../../_shared/service/user-service';
import { ReferralService } from '../../_shared/service/referral-service';
import { AppointmentService } from '../../_shared/service/appointment-service';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../_shared/component/dialog/confirm-dialog/confirm-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Referral, ReferralStatus } from '../../_shared/model/referral';

import { ReasonService } from '../../_shared/service/reason-service';

import { CommonModule } from '@angular/common';

import { AlertService } from '../../_shared/service/alert.service';


@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TimePicker,
    DatePicker,
    FormComponent,
    RouterLink,
    MatSelectModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule
  ],
  templateUrl: './appointment.html',
  styleUrls: ['./appointment.css']
})
export class AppointmentPage {
  @Output() onSubmitEvent = new EventEmitter<AppointmentPayload>()
  @Input() isLoading = false
  @Input() clinics: Clinic[] = []
  @Input() appointment!: Appointment
  @Input() dentalServices: DentalService[] = []
  user: UserSimple | null = null

  isChangeBranch = false;

  dentists: DentistDirectoryEntry[] = []
  selectedDentist?: DentistDirectoryEntry
  referralSavedData!: Referral;

  referringDentist: { value: string; label: string }[] = []

  rxform!: FormGroup<RxAppointmentForm>
  rxReferralForm!: FormGroup<RxReferralForm>
  appointmentFields: any[] = [];
  users: DentistDirectoryEntry[] = []
  selectReferringDentist: { value: string; label: string }[] = []

  minDate = new Date();

  // appointment limit to 3 months
  maxDate = new Date(
    new Date().setMonth(new Date().getMonth() + 3)
  );

  patientAppointments: Appointment[] = [];
  appointments: Appointment[] = [];

  reasons: { value: string; label: string }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly appointmentService: AppointmentService,
    private readonly referralService: ReferralService,
    private readonly reasonService: ReasonService,
    private dialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly bookingAvailability: BookingAvailabilityService,

  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.user = user;
      if (this.rxform) this.patient.setValue(user ? `${user.firstName} ${user.lastName}` : '');
    });
    const clinicId = this.appointment?.clinic?._id || '';
    const dentistId = this.appointment?.dentist?._id || '';
    this.rxform = this.fb.nonNullable.group({
      clinic: [clinicId, Validators.required],
      dentist: [dentistId, Validators.required],
      patient: [this.user ? `${this.user.firstName} ${this.user.lastName}` : '', Validators.required],
      services: [this.appointment?.services.map(service => service._id || '') || [] as string[], [Validators.required, Validators.maxLength(3)]],
      date: new FormControl<Date | null>(this.appointment?.date ? pickerDateFromStored(this.appointment.date) : null, Validators.required),
      time: [this.appointment?.startTime || '', Validators.required],
      patientNotes: [this.appointment?.notes?.patientNotes || ''],
    });
    this.rxReferralForm = this.fb.nonNullable.group({
      fromDoctorId: ['', Validators.required],
      fromClinicId: ['', Validators.required],
      reason: ['', Validators.required],
      appointment: [''],
    });
    this.clinic.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(clinicId => this.onClinicChanged(clinicId));
    this.dentist.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(dentistId => {
      this.clearDateTime();
      this.setDentist(dentistId);
    });
    this.date.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.time.setValue(''));
    this.services.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.time.setValue(''));
    this.builAppointmentFields();
    this.changeDentists(clinicId, dentistId);
    this.loadAppointments();
    this.reasonService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: reasons => this.reasons = reasons
        .filter(reason => reason.isActive && (reason.usage === 'referral' || reason.usage === 'both'))
        .map(reason => ({ value: reason.code, label: reason.label })),
      error: () => this.alertService.error('Unable to load referral reasons.'),
    });
  }

  private readonly destroyRef = inject(DestroyRef);
  private directoryRequest?: Subscription;
  private availabilityRequest?: Subscription;
  private clinicSelectionVersion = 0;
  bookingSchedule?: DentistBookingSchedule;
  availabilityLoading = false;
  availabilityError = '';
  confirmingClinic = false;
  savingReferral = false;

  private clearAvailability() {
    this.availabilityRequest?.unsubscribe();
    this.bookingSchedule = undefined;
    this.availabilityLoading = false;
    this.availabilityError = '';
  }

  private clearDateTime() {
    this.date.setValue(null);
    this.time.setValue('');
  }

  private changeDentists(clinicId: string, dentistId = '') {
    this.directoryRequest?.unsubscribe();
    this.clearAvailability();
    this.selectedDentist = undefined;
    this.dentists = [];
    this.dentist.setValue('', { emitEvent: false });
    this.builAppointmentFields();
    const clinic = this.clinics.find(c => c._id === clinicId);
    if (!clinic) return;
    this.availabilityLoading = true;
    const selectionVersion = this.clinicSelectionVersion;
    this.directoryRequest = this.userService.getDentists().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: users => {
        if (selectionVersion !== this.clinicSelectionVersion || this.clinic.value !== clinicId) return;
        this.users = users;
        if (this.isChangeBranch) this.updateReferringDentists();
        this.dentists = users.filter(user => isBookableDentist(user, clinicId));
        this.availabilityLoading = false;
        this.builAppointmentFields();
        const selected = this.dentists.find(dentist => dentist._id === dentistId);
        this.dentist.setValue(selected?._id || '', { emitEvent: false });
        this.setDentist(selected?._id || '');
      },
      error: () => {
        this.availabilityLoading = false;
        this.availabilityError = 'Unable to load dentists. Please select the clinic again.';
      },
    });
  }

  private setDentist(dentistId: string) {
    this.clearAvailability();
    const clinicId = this.clinic.value;
    const clinic = this.clinics.find(c => c._id === clinicId);
    this.selectedDentist = this.dentists.find(dentist => dentist._id === dentistId && isBookableDentist(dentist, clinicId));
    if (!clinic || !this.selectedDentist) {
      this.dentist.setValue('', { emitEvent: false });
      this.time.setValue('');
      return;
    }
    this.availabilityLoading = true;
    const selectionVersion = this.clinicSelectionVersion;
    this.availabilityRequest = this.bookingAvailability.load(this.selectedDentist, clinic, this.appointment?._id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: schedule => {
          if (selectionVersion !== this.clinicSelectionVersion || this.clinic.value !== clinicId || this.dentist.value !== dentistId) return;
          this.bookingSchedule = schedule;
          this.availabilityLoading = false;
          if (this.date.value && this.time.value && !this.selectedSlotAvailable()) this.time.setValue('');
        },
        error: () => {
          this.availabilityLoading = false;
          this.availabilityError = 'Unable to check availability. Please select the dentist again.';
          this.time.setValue('');
        },
      });
  }

  private selectedSlotAvailable(): boolean {
    return !!this.bookingSchedule && !!this.date.value && bookingSlots(
      this.bookingSchedule, this.date.value, this.serviceDuration(),
    ).some(slot => slot.value === this.time.value && slot.available);
  }

  get bookingUnavailable(): boolean {
    return this.isLoading || this.availabilityLoading || this.confirmingClinic || this.savingReferral || !this.bookingSchedule ||
      (this.isChangeBranch && this.rxReferralForm.invalid);
  }

  private onClinicChanged(clinicId: string) {
    const selectionVersion = ++this.clinicSelectionVersion;
    this.directoryRequest?.unsubscribe();
    this.clearAvailability();
    this.selectedDentist = undefined;
    this.dentists = [];
    this.dentist.setValue('', { emitEvent: false });
    this.clearDateTime();
    this.builAppointmentFields();
    this.confirmingClinic = false;
    this.isChangeBranch = false;
    const last = this.latestPatientAppointment;
    if (!last?.clinic._id || last.clinic._id === clinicId || !clinicId) {
      this.changeDentists(clinicId);
      return;
    }
    this.confirmingClinic = true;
    this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      width: '360px',
      data: { message: `You are about to change your clinic branch.

Existing scheduled appointments with the previous branch will NOT be automatically cancelled.

Do you want to proceed?` },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirm => {
      if (selectionVersion !== this.clinicSelectionVersion || this.clinic.value !== clinicId) return;
      this.confirmingClinic = false;
      if (!confirm) {
        this.applyPreviousAppointment();
        return;
      }
      this.isChangeBranch = true;
      this.updateReferringDentists();
      this.changeDentists(clinicId);
    });
  }

  private updateReferringDentists() {
    const last = this.latestPatientAppointment;
    const clinicId = last?.clinic._id || '';
    const referring = [...new Map(this.patientAppointments
      .filter(appointment => appointment.clinic?._id === clinicId && appointment.dentist?._id)
      .map(appointment => [appointment.dentist._id, appointment.dentist])).values()];
    this.selectReferringDentist = this.maptoOptions(this.setUsersKey(referring));
    this.rxReferralForm.patchValue({
      fromDoctorId: referring.some(dentist => dentist._id === last?.dentist?._id) ? last?.dentist?._id || '' : '',
      fromClinicId: clinicId,
    });
  }

  setDateAndTime() {
    this.clearDateTime();
  }
  private builAppointmentFields() {

    const selectClinic = this.maptoOptions(this.clinics)
    const selectDentalService = this.maptoOptions(this.dentalServices)
    this.appointmentFields = [
      { name: 'clinic', label: 'Clinic', type: 'select', options: selectClinic},
      { name: 'patient', label: 'Patient', type: 'text', readonly: true},
      { name: 'services', label: 'Services', type: 'select', options: selectDentalService, multiple: true},
      // { name: 'patient', label: 'Patient', type: 'select', options: selectPatient},
    ];
    // push the object inside the array if the clinic is selected
    this.checkDentist();
  }

  checkDentist () {
    this.appointmentFields = this.appointmentFields.filter(field => field.name !== 'dentist' && field.name !== 'patientNotes');
    if (this.dentists.length !== 0) {
      const customSelectDentist = this.setUsersKey(this.dentists)
      const selectDentist = this.maptoOptions(customSelectDentist)

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
      const service = this.dentalServices.find(d => d._id == c)
      return p + (service?.duration || 0)
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
    if (this.bookingUnavailable || this.rxform.invalid || !this.date.value || !this.selectedSlotAvailable()) {
      this.rxform.markAllAsTouched();
      return;
    }
    const duration = this.serviceDuration();
    const startTime = this.time.value;
    const endTime = TimeUtil.calculateEndTime(startTime, duration);
    const previousClinicId = this.latestPatientAppointment?.clinic._id;


    const appointment: AppointmentPayload = {
      clinic: this.clinic.value ?? '',
      dentist: this.dentist.value,
      patient: this.user?._id || '',
      services: this.services.value,
      date: this.date.value,
      startTime: this.time.value,
      endTime: endTime,
      status: AppointmentStatus.PENDING,
      notes: {
        clinicNotes: '',
        patientNotes: this.rxform.controls.patientNotes.value || '',
      },
      // referral: ''
      // history: []
    }
    
    // NO referral → save appointment directly
    if (!this.isChangeBranch) {
      this.onSubmitEvent.emit(appointment)
      return;
    }
    // WITH referral → create referral first
    const referral: ReferralPayload = {
      fromDoctorId: this.fromDoctorId.value,
      fromClinicId: previousClinicId ?? '',
      reason: this.reason.value,
      status: ReferralStatus.PENDING,
    };

    // Create referral, then attach its ID to the appointment payload
    this.savingReferral = true;
    this.referralService.create(referral).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: savedReferral => {
        this.savingReferral = false;
        appointment.referral = savedReferral._id; // optional ID
        // Emit the payload for the parent or whoever is listening
        this.onSubmitEvent.emit(appointment);
      },
      error: err => {
        this.savingReferral = false;
        this.alertService.error(err.error.message)
      }
    });


  }

  private loadAppointments() {
    this.isLoading = true;
    const selectionVersion = this.clinicSelectionVersion;
    this.appointmentService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: appointments => {
        this.appointments = appointments;
        this.refreshPatientAppointments();
        if (selectionVersion === this.clinicSelectionVersion && !this.appointment?._id && !this.clinic.value) this.applyPreviousAppointment();
      },
      error: () => {
        this.isLoading = false;
        this.alertService.error('Unable to load previous appointments.');
      },
      complete: () => this.isLoading = false,
    });
  }

  private refreshPatientAppointments() {
    const patientId = this.user?._id;
    const now = new Date();
    this.patientAppointments = this.appointments.filter(appointment =>
      appointment.patient?._id === patientId && isPreviousTreatment(appointment, now),
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  applyPreviousAppointment() {
    ++this.clinicSelectionVersion;
    this.confirmingClinic = false;
    this.isChangeBranch = false;
    const last = this.latestPatientAppointment;
    this.rxform.patchValue({
      clinic: last?.clinic._id || '',
      dentist: '',
      services: last?.services.map(service => service._id).filter((id): id is string => !!id) || [],
      date: null,
      time: '',
    }, { emitEvent: false });
    this.changeDentists(last?.clinic._id || '', last?.dentist?._id || '');
  }

  get latestPatientAppointment(): Appointment | undefined {
    const currentAppointmentData = this.patientAppointments[0];
    return currentAppointmentData;
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

  get fromDoctorId() {
    return this.rxReferralForm.controls.fromDoctorId
  }

  get reason() {
    return this.rxReferralForm.controls.reason
  }
}
