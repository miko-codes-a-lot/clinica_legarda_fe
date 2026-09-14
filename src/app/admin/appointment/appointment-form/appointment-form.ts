import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { bookingSlots, DentistBookingSchedule, isBookableDentist, pickerDateFromStored } from '../../../_shared/model/booking-availability';
import { BookingAvailabilityService } from '../../../_shared/service/booking-availability-service';
import { Component, EventEmitter, Input, Output, DestroyRef, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentPayload } from '../appointment-payload';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { User } from '../../../_shared/model/user';
import { RxAppointmentForm } from './rx-appointment-form';
import { DentalService } from '../../../_shared/model/dental-service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { Clinic } from '../../../_shared/model/clinic';
import { DatePicker } from '../../../_shared/component/date-picker/date-picker';
import { TimePicker } from '../../../_shared/component/time-picker/time-picker';
import { TimeUtil } from '../../../utils/time-util';
import { UserService } from '../../../_shared/service/user-service';
import { FormComponent } from '../../../_shared/component/form/form.component';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../_shared/component/dialog/confirm-dialog/confirm-dialog.component';
import { RxReferralForm } from '../../../client/appointment/rx-referral-form';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ReferralPayload } from '../../../admin/appointment/referral-payload';
import { ReferralStatus } from '../../../_shared/model/referral';
import { ReferralService } from '../../../_shared/service/referral-service';
import { ReasonService } from '../../../_shared/service/reason-service';

import { AlertService } from '../../../_shared/service/alert.service';


@Component({
  selector: 'app-appointment-form',
  imports: [
    ReactiveFormsModule,
    TimePicker,
    DatePicker,
    FormComponent,
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
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

  // appointment limit to 3 months
  maxDate = new Date(
    new Date().setMonth(new Date().getMonth() + 3)
  );

  isEditMode = false;

  appointments: Appointment[] = [];

  patientAppointments: Appointment[] = [];

  isChangeBranch = false;

  
  users: User[] = []
  selectReferringDentist: { value: string; label: string }[] = [];
  rxReferralForm!: FormGroup<RxReferralForm>;
  reasons: { value: string; label: string }[] = [];


  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly appointmentService: AppointmentService,
    private dialog: MatDialog,
    private readonly referralService: ReferralService,
    private readonly reasonService: ReasonService,
    private readonly alertService: AlertService,
    private readonly bookingAvailability: BookingAvailabilityService,
  ) {}

  ngOnInit(): void {
    const clinicId = this.appointment?.clinic?._id || '';
    const dentistId = this.appointment?.dentist?._id || '';
    this.isEditMode = !!this.appointment?._id;
    this.rxform = this.fb.nonNullable.group({
      clinic: [clinicId, Validators.required],
      dentist: [dentistId, Validators.required],
      patient: [this.appointment?.patient?._id || '', Validators.required],
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
    this.buildAppointmentFields();
    this.changeDentists(clinicId, dentistId);
    this.loadAppointments();
    this.reasonService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: reasons => this.reasons = reasons
        .filter(reason => reason.isActive && (reason.usage === 'referral' || reason.usage === 'both'))
        .map(reason => ({ value: reason.code, label: reason.label })),
      error: () => this.alertService.error('Unable to load referral reasons.'),
    });
    this.patient.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshPatientAppointments();
      if (!this.isEditMode) this.applyPreviousAppointment();
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
    this.buildAppointmentFields();
    const clinic = this.clinics.find(c => c._id === clinicId);
    if (!clinic) return;
    this.availabilityLoading = true;
    const selectionVersion = this.clinicSelectionVersion;
    this.directoryRequest = this.userService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: users => {
        if (selectionVersion !== this.clinicSelectionVersion || this.clinic.value !== clinicId) return;
        this.users = users;
        if (this.isChangeBranch) this.updateReferringDentists();
        this.dentists = users.filter(user => isBookableDentist(user, clinicId));
        this.availabilityLoading = false;
        this.buildAppointmentFields();
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
    this.buildAppointmentFields();
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
      data: { message: `You are about to change the patient's clinic branch.

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
    const referring = this.users.filter(user => isBookableDentist(user, clinicId));
    this.selectReferringDentist = this.mapToOptions(this.setUsersKey(referring));
    this.rxReferralForm.patchValue({
      fromDoctorId: referring.some(dentist => dentist._id === last?.dentist?._id) ? last?.dentist?._id || '' : '',
      fromClinicId: clinicId,
    });
  }

  setDateAndTime() {
    this.clearDateTime();
  }
  private buildAppointmentFields() {
    const filteredPatients = this.patients?.filter(
      p => p.role === 'user'
      && p.status === 'confirmed'
    );
    const customPatients = this.setUsersKey(filteredPatients);

    const selectClinic = this.mapToOptions(this.clinics);
    const selectPatient = this.mapToOptions(customPatients);
    const selectDentalService = this.mapToOptions(this.dentalServices);

    this.appointmentFields = [
      { name: 'patient', label: 'Patient', type: 'select', options: selectPatient },
      { name: 'clinic', label: 'Clinic', type: 'select', options: selectClinic },
      { name: 'services', label: 'Services', type: 'select', options: selectDentalService, multiple: true },
      {
        name: 'patientNotes',
        label: 'Notes for Dentist',
        type: 'textarea',
        placeholder: 'Write any notes or concerns for your dentist here...',
      }
    ];
    this.checkDentist();
  }

  checkDentist() {
    // remove existing dentist field first
    this.appointmentFields = this.appointmentFields.filter(
      f => f.name !== 'dentist'
    );

    if (this.dentists.length === 0) return;

    const customDentists = this.setUsersKey(this.dentists);
    const selectDentist = this.mapToOptions(customDentists);

    this.appointmentFields.splice(2, 0, {
      name: 'dentist',
      label: 'Dentist',
      type: 'select',
      options: selectDentist
    });
  }

  private setUsersKey(items: { firstName: string; lastName: string }[]) {
    return items.map(item => ({ ...item, name: `${item.firstName} ${item.lastName}` }));
  }

  private mapToOptions(items: { _id?: string; name: string }[]): { value: string; label: string }[] {
  return items.map(item => ({
    value: item._id ?? '',
    label: item.name
  }));
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
    const patientId = this.patient.value;
    const now = new Date();
    this.patientAppointments = this.appointments.filter(appointment =>
      appointment.patient?._id === patientId && appointment.status === 'confirmed' &&
      pickerDateFromStored(appointment.date) < now,
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    if (this.bookingUnavailable || this.rxform.invalid || !this.date.value || !this.selectedSlotAvailable()) {
      this.rxform.markAllAsTouched();
      return;
    }
    const duration = this.serviceDuration();
    const startTime = this.time.value;
    const endTime = TimeUtil.calculateEndTime(startTime, duration);
    const previousClinicId = this.latestPatientAppointment?.clinic._id;

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

    if (!this.isChangeBranch) {
      this.onSubmitEvent.emit(appointmentData)
      return;
    }

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
        appointmentData.referral = savedReferral._id; // optional ID
        // Emit the payload for the parent or whoever is listening
        this.onSubmitEvent.emit(appointmentData);
      },
      error: err => {
        this.savingReferral = false;
        this.alertService.error(`${err}`)
      }
    });

  }

  get clinic() { return this.rxform.controls.clinic; }
  get dentist() { return this.rxform.controls.dentist; }
  get patient() { return this.rxform.controls.patient; }
  get services() { return this.rxform.controls.services; }
  get date() { return this.rxform.controls.date; }
  get time() { return this.rxform.controls.time; }
  get selectedPatient(): User | undefined {
    return this.patients.find(p => p._id === this.patient.value);
  }

  get latestPatientAppointment(): Appointment | undefined {
    const currentAppointmentData = this.patientAppointments[0];
    return currentAppointmentData;
  }

  get fromDoctorId() {
    return this.rxReferralForm.controls.fromDoctorId
  }

  get reason() {
    return this.rxReferralForm.controls.reason
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

  getServiceNames(services?: { name: string }[]): string {
    if (!services?.length) return 'N/A';
    return services.map(s => s.name).join(', ');
  }
}
