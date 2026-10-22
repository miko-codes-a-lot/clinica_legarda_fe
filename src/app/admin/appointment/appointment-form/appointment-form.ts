import { reasonTextValidator } from '../../../utils/forms/reason-validator';
import { EmptyState } from '../../../_shared/ui/empty-state/empty-state';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { bookingSlots, DentistBookingSchedule, isBookableDentist, pickerDateFromStored } from '../../../_shared/model/booking-availability';
import { BookingAvailabilityService } from '../../../_shared/service/booking-availability-service';
import { Component, EventEmitter, Input, Output, DestroyRef, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentPayload } from '../appointment-payload';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { isPreviousTreatment } from '../../../_shared/model/appointment-history';
import { DentistDirectoryEntry, PatientDirectoryEntry } from '../../../_shared/model/user-directory';
import { RxAppointmentForm } from './rx-appointment-form';
import { DentalService, servicesForClinic } from '../../../_shared/model/dental-service';
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
import { Icon } from '../../../_shared/ui/icon/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ReferralPayload } from '../../../admin/appointment/referral-payload';
import { ReferralStatus } from '../../../_shared/model/referral';
import { ReferralService } from '../../../_shared/service/referral-service';

import { AlertService } from '../../../_shared/service/alert.service';
import { AuthService } from '../../../_shared/service/auth-service';
import { isStaffBookablePatient } from '../../../_shared/model/user';
import { FormField } from '../../../_shared/component/form/form-field.interface';


@Component({
  selector: 'app-appointment-form',
  imports: [EmptyState,
    ReactiveFormsModule,
    TimePicker,
    DatePicker,
    FormComponent,
    CommonModule,
    Icon,
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
  @Input() patients: PatientDirectoryEntry[] = [];

  dentists: DentistDirectoryEntry[] = [];
  selectedDentist?: DentistDirectoryEntry;

  rxform!: FormGroup<RxAppointmentForm>;
  appointmentFields: FormField[] = [];

  minDate = new Date();

  // appointment limit to 3 months
  maxDate = new Date(
    new Date().setMonth(new Date().getMonth() + 3)
  );

  isEditMode = false;

  appointments: Appointment[] = [];

  patientAppointments: Appointment[] = [];

  isChangeBranch = false;

  
  users: DentistDirectoryEntry[] = []
  selectReferringDentist: { value: string; label: string }[] = [];
  rxReferralForm!: FormGroup<RxReferralForm>;


  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly appointmentService: AppointmentService,
    private dialog: MatDialog,
    private readonly referralService: ReferralService,
    private readonly alertService: AlertService,
    private readonly bookingAvailability: BookingAvailabilityService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    const clinicId = this.appointment?.clinic?._id || '';
    const dentistId = this.appointment?.dentist?._id || '';
    this.isEditMode = !!this.appointment?._id;
    this.rxform = this.fb.nonNullable.group({
      clinic: [clinicId, Validators.required],
      dentist: [dentistId, Validators.required],
      patient: [this.appointment?.patient?._id || '', Validators.required],
      services: this.fb.nonNullable.control(this.appointment?.services.map(service => service._id || '') || [] as string[], [Validators.required, Validators.maxLength(3), (control: AbstractControl<string[]>) => {
        const selected = control.value as string[];
        const available = servicesForClinic(this.dentalServices, this.rxform?.controls.clinic.value ?? clinicId);
        return selected.some(id => !available.some(service => service._id === id)) ? { clinicServices: true } : null;
      }]),
      date: new FormControl<Date | null>(this.appointment?.date ? pickerDateFromStored(this.appointment.date) : null, Validators.required),
      time: [this.appointment?.startTime || '', Validators.required],
      patientNotes: [this.appointment?.notes?.patientNotes || ''],
      isWalkIn: [this.appointment?.isWalkIn ?? false],
    });
    if (this.authService.currentUserValue?.role === 'dentist' && this.isEditMode) {
      this.dentist.disable({ emitEvent: false });
      if (this.isEditMode) {
        this.clinic.disable({ emitEvent: false });
        this.patient.disable({ emitEvent: false });
      }
    }
    if (this.appointment?.careCase) {
      // Ongoing treatment can be planned six months ahead. Clamp month-end
      // dates so August 31 reaches February's last day, without rolling into March.
      const lastDay = new Date(this.minDate.getFullYear(), this.minDate.getMonth() + 7, 0);
      this.maxDate = new Date(lastDay.getFullYear(), lastDay.getMonth(),
        Math.min(this.minDate.getDate(), lastDay.getDate()));
      this.clinic.disable({ emitEvent: false });
      this.dentist.disable({ emitEvent: false });
      this.patient.disable({ emitEvent: false });
    }
    this.rxReferralForm = this.fb.nonNullable.group({
      fromDoctorId: ['', Validators.required],
      fromClinicId: ['', Validators.required],
      reason: ['', [Validators.required, reasonTextValidator]],
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
  private readonly savedReferrals = new Map<string, { id: string; reason: string }>();

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
    this.directoryRequest = this.userService.getDentists().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: users => {
        if (selectionVersion !== this.clinicSelectionVersion || this.clinic.value !== clinicId) return;
        this.users = users;
        if (this.isChangeBranch) this.updateReferringDentists();
        this.dentists = users.filter(user => isBookableDentist(user, clinicId) &&
          (this.authService.currentUserValue?.role !== 'dentist' || (!this.isEditMode && !this.appointment?.careCase) || user._id === this.authService.currentUserValue._id));
        this.availabilityLoading = false;
        this.buildAppointmentFields();
        const selectedId = this.authService.currentUserValue?.role === 'dentist'
          ? this.authService.currentUserValue._id : dentistId;
        const selected = this.dentists.find(dentist => dentist._id === selectedId);
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
    if (this.requiresReferral) this.updateReferringDentists();
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
      (this.requiresReferral && this.rxReferralForm.invalid);
  }

  get requiresReferral(): boolean {
    return this.isChangeBranch || (this.authService.currentUserValue?.role === 'dentist' && !this.isEditMode &&
      !!this.selectedDentist && this.selectedDentist._id !== this.authService.currentUserValue._id);
  }

  get referralSourceAppointment(): Appointment | undefined {
    const actor = this.authService.currentUserValue;
    if (actor?.role !== 'dentist') return this.latestPatientAppointment;
    return this.appointments.filter(row => row.patient?._id === this.patient.value && row.dentist?._id === actor._id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

  private onClinicChanged(clinicId: string) {
    const selectionVersion = ++this.clinicSelectionVersion;
    this.directoryRequest?.unsubscribe();
    this.clearAvailability();
    this.selectedDentist = undefined;
    this.dentists = [];
    this.dentist.setValue('', { emitEvent: false });
    this.services.setValue([], { emitEvent: false });
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
    const last = this.referralSourceAppointment;
    const clinicId = last?.clinic._id || '';
    const actor = this.authService.currentUserValue;
    const referring = [...new Map((actor?.role === 'dentist' ? this.appointments.filter(row => row.dentist?._id === actor._id && row.patient?._id === this.patient.value) : this.patientAppointments)
      .filter(appointment => appointment.clinic?._id === clinicId && appointment.dentist?._id)
      .map(appointment => [appointment.dentist._id, appointment.dentist])).values()];
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
    const filteredPatients = this.patients?.filter(isStaffBookablePatient);
    const customPatients = this.setUsersKey(filteredPatients);

    const selectClinic = this.mapToOptions(this.clinics);
    const selectPatient = this.mapToOptions(customPatients);
    const selectDentalService = this.mapToOptions(servicesForClinic(this.dentalServices, this.clinic.value));

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
      appointment.patient?._id === patientId && isPreviousTreatment(appointment, now),
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

    const appointmentData: AppointmentPayload = {
      clinic: this.clinic.value ?? '',
      dentist: this.dentist.value,
      patient: this.patient.value,
      services: this.services.value,
      date: this.date.value,
      startTime,
      endTime,
      status: AppointmentStatus.PENDING,
      isWalkIn: this.rxform.controls.isWalkIn.value,
      ...(this.appointment?.careCase ? { careCase: this.appointment.careCase } : {}),
      notes: {
        clinicNotes: this.appointment?.notes?.clinicNotes || '',
        patientNotes: this.rxform.controls.patientNotes.value || ''
      }
    };

    if (!this.requiresReferral) {
      this.onSubmitEvent.emit(appointmentData)
      return;
    }

    const referral: ReferralPayload = {
      patient: this.patient.value,
      fromDoctorId: this.fromDoctorId.value,
      fromClinicId: this.rxReferralForm.controls.fromClinicId.value,
      reason: this.reason.value.trim(),
      status: ReferralStatus.PENDING,
    };

    // Keep the same referral across failed/lost booking responses. The backend's
    // single-link check then prevents a retry from creating a second reservation.
    const key = JSON.stringify([this.authService.currentUserValue?._id, referral.patient, referral.fromDoctorId, referral.fromClinicId]);
    const saved = this.savedReferrals.get(key);
    if (saved && saved.reason === referral.reason) {
      appointmentData.referral = saved.id;
      this.onSubmitEvent.emit(appointmentData);
      return;
    }
    this.savingReferral = true;
    const saveReferral = saved ? this.referralService.update(saved.id, referral) : this.referralService.create(referral);
    saveReferral.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: savedReferral => {
        this.savingReferral = false;
        const id = saved?.id ?? savedReferral._id;
        if (!id) { this.alertService.error('The referral could not be linked. Please try again.'); return; }
        this.savedReferrals.set(key, { id, reason: referral.reason ?? '' });
        appointmentData.referral = id;
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
  get selectedPatient(): PatientDirectoryEntry | undefined {
    return this.patients.find(p => p._id === this.patient.value);
  }

  get hasBookablePatients(): boolean { return this.patients.some(isStaffBookablePatient); }

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
    this.rxReferralForm.reset({ fromDoctorId: '', fromClinicId: '', reason: '', appointment: '' });
    const last = this.latestPatientAppointment;
    this.rxform.patchValue({
      clinic: last?.clinic._id || '',
      dentist: '',
      services: (last?.services ?? []).map(service => service._id).filter((id): id is string => !!id && servicesForClinic(this.dentalServices, last?.clinic._id ?? '').some(service => service._id === id)),
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
