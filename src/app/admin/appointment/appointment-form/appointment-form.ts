import { Component, EventEmitter, Input, Output, ChangeDetectorRef, ɵɵsetComponentScope } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { AuthService } from '../../../_shared/service/auth-service';
import { UserSimple } from '../../../_shared/model/user-simple';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ReferralPayload } from '../../../admin/appointment/referral-payload';
import { Referral, ReferralStatus } from '../../../_shared/model/referral';
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
  user: UserSimple | null = null

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

  isChangeBranch: Boolean = false;

  previousClinicId: string | null = null;
  
  users: User[] = []
  selectReferringDentist: { value: string; label: string }[] = [];
  rxReferralForm!: FormGroup<RxReferralForm>;
  reasons: { value: string; label: string }[] = [];


  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private cdr: ChangeDetectorRef,
    private readonly appointmentService: AppointmentService,
    private dialog: MatDialog,
    private readonly authService: AuthService,
    private readonly referralService: ReferralService,
    private readonly reasonService: ReasonService,
    private readonly alertService: AlertService,
  ) {}

  // private emptyDentist: User = {
  //   _id: '',
  //   firstName: '',
  //   middleName: '',
  //   lastName: '',
  //   emailAddress: '',
  //   mobileNumber: '',
  //   address: '',
  //   role: 'dentist',
  //   operatingHours: [],
  //   appointments: [],
  // };

  ngOnInit(): void {

    // this.loadAppointments();
    // this.authService.currentUser$.subscribe({
    //   next: (u) => {
    //     this.user = u
    //   }
    // })
    this.isEditMode = !!this.appointment;

    const clinicId = this.appointment?.clinic?._id || '';
    const dentistId = this.appointment?.dentist?._id || '';

    // Initialize reactive form
    this.rxform = this.fb.nonNullable.group({
      clinic: [clinicId, Validators.required],
      dentist: [dentistId, Validators.required],
      patient: [this.appointment?.patient?._id || '', Validators.required],
      services: [
        this.appointment?.services.map(s => s._id || '') || [] as string[],
        [
          Validators.required,
          Validators.maxLength(3)
        ]
      ],
      date: [this.appointment?.date ? new Date(this.appointment.date) : new Date(), Validators.required],
      time: [this.appointment?.startTime || '', Validators.required],
      patientNotes: [this.appointment?.notes?.patientNotes || '']
    });

    this.rxReferralForm = this.fb.nonNullable.group({
      fromDoctorId: ['', Validators.required],
      fromClinicId: ['', Validators.required],
      reason: [''],
      appointment: [''],
    })
    // Load dentists and set selected dentist + patch date/time if edit mode
    this.loadDentists(clinicId, dentistId);

    // Listen to clinic changes

    
    
    this.clinic.valueChanges.subscribe((clinicId: string) => {
      const last = this.latestPatientAppointment;
      const prevClinicId = this.previousClinicId;
      const selectedClinicId = this.rxform.get('clinic')?.value;
      const previousAppointmentId = this.latestPatientAppointment?.clinic._id;
      const restorePreviousClinic = () => {
        this.rxform.patchValue(
          {
            clinic: prevClinicId || '',
            dentist: last?.dentist?._id || '',
            services: last?.services
              ?.map(s => s._id)
              .filter((id): id is string => !!id) || []
          },
          { emitEvent: false }
        );

        this.changeDentists(prevClinicId || '', () => {
          this.setDentist(last?.dentist?._id || '');
        });
      };

      // ✅ SAME clinic → auto restore, no dialog
      if (prevClinicId && clinicId === prevClinicId) {
        this.isChangeBranch = false;
        this.changeDentists(clinicId);
        return;
      }

      // ✅ HAS previous appointment AND changing clinic → confirm
      if (last?.clinic._id && (selectedClinicId !== previousAppointmentId)) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          disableClose: true,
          width: '360px',
          data: {
            message: `You are about to change the patient's clinic branch.

    If the patient has an existing scheduled appointment with the previous branch, it will NOT be automatically cancelled.

    Do you want to proceed?`
          }
        });

        dialogRef.afterClosed().subscribe(confirm => {
          if (confirm) {
            // ✅ admin accepted
            this.isChangeBranch = true;
            this.previousClinicId = clinicId;

            const previousDentist = this.latestPatientAppointment?.dentist._id
            const oldClinicId = this.latestPatientAppointment?.clinic._id

            const getMOldClinicData = [];
            for (let i = 0; i < this.users.length; i++) {
              if (this.users[i].clinic === oldClinicId) {
                getMOldClinicData.push(this.users[i]);
              }
            }

            const customSelectDentist = this.setUsersKey(getMOldClinicData)
            this.selectReferringDentist = this.mapToOptions(customSelectDentist)

            this.rxReferralForm.patchValue({
              fromDoctorId: previousDentist || ''
            });

            this.changeDentists(clinicId);
            this.clearDateTime();
          } else {
            // ❌ admin cancelled
            this.isChangeBranch = false;
            restorePreviousClinic();
          }
        });

        // return;
      } else {
        this.isChangeBranch = false;
        this.selectedDentist = this.latestPatientAppointment?.dentist
      }
      // setDentist
      // ✅ First selection / no previous appointment
      this.previousClinicId = clinicId;
      this.changeDentists(clinicId);
      this.clearDateTime();
    });

    // Listen to dentist changes

    this.dentist.valueChanges.subscribe({
      next: (dentistId) => {
        this.setDentist(dentistId);
        if (!this.isEditMode) this.clearDateTime();
        // reset date and time
        this.date.setValue(null as any);
        this.time.setValue('');

        if (!this.selectedDentist) return;

        // ensure arrays exist to prevent runtime errors
        this.selectedDentist.operatingHours = this.selectedDentist.operatingHours || [];
        this.selectedDentist.appointments = this.selectedDentist.appointments || [];
      }
    });

    // Only clear time when creating a new appointment
    if (!this.isEditMode) {
      this.date.valueChanges.subscribe(() => this.time.setValue(''));
    }

    this.buildAppointmentFields();
    this.loadAppointments();

    this.reasonService.getAll().subscribe({
      next: (data) => {
        // Map your reasons to { value, label } format for mat-select
        this.reasons = data
          .filter(r => r.isActive && (r.usage === 'referral' || r.usage === 'both'))
          .map(r => ({ value: r.code, label: r.label }));
      },
      error: (err) => console.error('Failed to load reasons', err)
    });

    this.patient.valueChanges.subscribe(patientId => {
      if (!patientId) {
        this.patientAppointments = [];
        return;
      }
      const now = new Date();
      this.patientAppointments = this.appointments
        .filter(a =>
          a.patient?._id === patientId
          && a.status === 'confirmed'
          && new Date(a.date) < now // only past appointments
        )
        .sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      this.applyPreviousAppointment();
      this.cdr.detectChanges();
    });
  }

  private changeDentists(clinicId: string, callback?: () => void) {
    const clinic = this.clinics.find(c => c._id == clinicId)
    if (!clinic) return

    this.userService.getAll().subscribe(users => {
      this.users = users;
      // filter dentists by clinic
      this.dentists = users.filter(u => u.clinic === clinic._id
        && u.status === 'confirmed'
      ) || []
      this.buildAppointmentFields();

      if (!this.dentists.find(d => d._id === this.selectedDentist?._id)) {
        this.selectedDentist = undefined
        this.time.setValue('')
      }

      if (callback) callback();
    })
    // this.dentists = clinic.dentists
    // this.builAppointmentFields();
  }

  private loadDentists(clinicId: string, dentistId?: string) {
    const clinic = this.clinics.find(c => c._id === clinicId);
    if (!clinic) return;

    this.userService.getAll().subscribe(users => {
      this.users = users;
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
    // if there is a dentist then display
    // if no dentist then clear the selectedDentist
  }


  private clearDateTime() {
    this.date.setValue(new Date());
    this.time.setValue('');
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
    this.appointmentService.getAll().subscribe({
      next: (data) => {
        this.appointments = data;
        // Now that appointments are loaded, filter patient appointments
        if (this.user) {
          const now = new Date();
          this.patientAppointments = this.appointments
            .filter(a =>
              a.patient?._id === this.user?._id
              && a.status === 'confirmed'
              && new Date(a.date) < now
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          this.applyPreviousAppointment();
        }
      },
      error: (e) => this.alertService.error(`Something went wrong ${e}`),
      complete: () => this.isLoading = false
    });
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
      fromDoctorId: this.fromDoctorId.value!,
      fromClinicId: previousClinicId ?? '',
      reason: this.reason.value,
      status: ReferralStatus.PENDING,
    };

    // Create referral, then attach its ID to the appointment payload
    this.referralService.create(referral).subscribe({
      next: savedReferral => {
        appointmentData.referral = savedReferral._id; // optional ID
        // Emit the payload for the parent or whoever is listening
        this.onSubmitEvent.emit(appointmentData);
      },
      error: err => {
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
    const last = this.latestPatientAppointment;

    if (last) {
      this.previousClinicId = last.clinic._id || ''; // 🔑 LOCK reference

      this.rxform.patchValue({
        clinic: last.clinic._id,
        services: last.services
          .map(s => s._id)
          .filter((id): id is string => !!id),
      });

      this.changeDentists(last.clinic._id || '', () => {
        this.rxform.patchValue({
          dentist: last.dentist?._id || ''
        });
        this.setDentist(last.dentist?._id || '');
        this.setDateAndTime();
      });
    } else {
      // ✅ No previous appointment → clear all relevant fields
      this.previousClinicId = null;
      this.rxform.patchValue({
        clinic: '',
        dentist: '',
        services: [],
        date: new Date(),
        time: ''
      });
      this.selectedDentist = undefined;
    }

    this.checkDentist();
  }

  setDateAndTime() {
    // reset date and time
    this.date.setValue(null as any);
    this.time.setValue('');

    if (!this.selectedDentist) return;

    // ensure arrays exist to prevent runtime errors
    this.selectedDentist.operatingHours = this.selectedDentist.operatingHours || [];
    this.selectedDentist.appointments = this.selectedDentist.appointments || [];
  }

  getServiceNames(services?: { name: string }[]): string {
    if (!services?.length) return 'N/A';
    return services.map(s => s.name).join(', ');
  }
}
