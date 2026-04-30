import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentPayload } from '../../admin/appointment/appointment-payload';
import { ReferralPayload } from '../../admin/appointment/referral-payload';
import { Appointment, AppointmentStatus } from '../../_shared/model/appointment';
import { User, UserStatus } from '../../_shared/model/user';
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
import { switchMap } from 'rxjs/operators';
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
  @Input() patients: User[] = []
  // @Input() loggedInUser?: User[] = []
  user: UserSimple | null = null

  isChangeBranch: Boolean = false;

  dentists: User[] = []
  selectedDentist?: User
  referralSavedData!: Referral;

  referringDentist: { value: string; label: string }[] = []

  rxform!: FormGroup<RxAppointmentForm>
  rxReferralForm!: FormGroup<RxReferralForm>
  appointmentFields: any[] = [];
  users: User[] = []
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

  ) {}

  private emptyDentist: User = {
    _id: '',
    firstName: '',
    middleName: '',
    lastName: '',
    emailAddress: '',
    mobileNumber: '',
    address: '',
    role: 'dentist',
    operatingHours: [],
    appointments: [],
  };

  private clearDateTime() {
    this.date.setValue(new Date())
    this.time.setValue('')
  }

  private changeDentists(clinicId: string, callback?: () => void) {
    const clinic = this.clinics.find(c => c._id == clinicId)
    if (!clinic) return

    this.userService.getAll().subscribe(users => {
      this.users = users;
      // filter dentists by clinic
      this.dentists = users.filter(u => u.clinic === clinic._id && u.status === 'confirmed') || []
      this.builAppointmentFields();

      if (!this.dentists.find(d => d._id === this.selectedDentist?._id)) {
        this.selectedDentist = undefined
        this.time.setValue('')
      }

      if (callback) callback();
    })
    // this.dentists = clinic.dentists
    // this.builAppointmentFields();
  }

  private setDentist(dentistId: string) {
    if (!this.dentists) return
    const dentist = this.dentists.find(d => d._id == dentistId)
    this.selectedDentist = dentist
  }

  ngOnInit(): void {
    this.loadAppointments();
    this.authService.currentUser$.subscribe({
      next: (u) => {
        this.user = u
      }
    })

    const clinicId = this.appointment.clinic._id || ''
    const dentistId = this.appointment.dentist._id || ''
    const user = this.user
    this.rxform = this.fb.nonNullable.group({
      clinic: [clinicId, Validators.required],
      dentist: [dentistId, Validators.required],
      patient: [user? `${user?.firstName} ${user?.lastName} `: '', Validators.required],
      services: [
        this.appointment?.services.map(s => s._id || '') || [] as string[],
        [
          Validators.required,
          Validators.maxLength(3)
        ]
      ],
      date: [this.appointment.date, Validators.required],
      time: [this.appointment.startTime, Validators.required],
      patientNotes: [this.appointment.notes?.patientNotes || '']
    })
    this.rxReferralForm = this.fb.nonNullable.group({
      fromDoctorId: ['', Validators.required],
      fromClinicId: ['', Validators.required],
      reason: [''],
      appointment: [''],
    })
    this.changeDentists(clinicId)
    this.setDentist(dentistId)
    this.clinic.valueChanges.subscribe({
      next: (v) => {
          const previousAppointmentId = this.latestPatientAppointment?.clinic._id;
          const selectedClinicId = this.rxform.get('clinic')?.value;

          if (previousAppointmentId && (selectedClinicId != previousAppointmentId) ) {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
              disableClose: true,
              width: '360px',
              data: {
                message: `You are about to change your clinic branch.

                If you have existing scheduled appointment with your previous branch it will NOT be automatically cancelled.

                Do you want to proceed?`
              }
            });

            dialogRef.afterClosed().subscribe(confirm => {
              // put it here
              // it should be value and label
              // this.referringDentist = 
              this.isChangeBranch = confirm
              if (confirm) {
                const previousDentist = this.latestPatientAppointment?.dentist._id
                const clinicId = this.latestPatientAppointment?.clinic._id
                const getPreviousDentist = this.users.filter(u => u.clinic === clinicId) || []

                const customSelectDentist = this.setUsersKey(getPreviousDentist)
                this.selectReferringDentist = this.maptoOptions(customSelectDentist)

                this.rxReferralForm.patchValue({
                  fromDoctorId: previousDentist || ''
                });
           
              } else {
                this.loadAppointments();
              }
            });
          } else {
            this.isChangeBranch = false;
            this.selectedDentist = this.latestPatientAppointment?.dentist
          }
        // this is not the fetching one
        this.changeDentists(v)
        this.clearDateTime()
      }
    })
    this.dentist.valueChanges.subscribe({
      next: (dentistId) => {
        this.setDentist(dentistId);
        this.setDateAndTime()
      }
    });


    this.date.valueChanges.subscribe({
      next: (v) => {
        this.time.setValue('')
      }
    })
    this.builAppointmentFields();

    
    this.reasonService.getAll().subscribe({
      next: (data) => {
        // Map your reasons to { value, label } format for mat-select
        this.reasons = data
          .filter(r => r.isActive && (r.usage === 'referral' || r.usage === 'both'))
          .map(r => ({ value: r.code, label: r.label }));
      },
      error: (err) => console.error('Failed to load reasons', err)
    });
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
      fromDoctorId: this.fromDoctorId.value!,
      fromClinicId: previousClinicId ?? '',
      reason: this.reason.value,
      status: ReferralStatus.PENDING,
    };

    // Create referral, then attach its ID to the appointment payload
    this.referralService.create(referral).subscribe({
      next: savedReferral => {
        appointment.referral = savedReferral._id; // optional ID
        // Emit the payload for the parent or whoever is listening
        this.onSubmitEvent.emit(appointment);
      },
      error: err => {
        console.log('error', err);
        this.alertService.error(err.error.message)
      }
    });


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
      error: (e) => this.alertService.error(e.error.message),
      complete: () => this.isLoading = false
    });
  }


  applyPreviousAppointment() {
    const last = this.latestPatientAppointment;
    if (last){

      this.rxform.patchValue({
        clinic: last.clinic._id,
        services: last?.services
        .map(s => s._id)
        .filter((id): id is string => !!id) || [],
      });

      // load dentists and set dentist AFTER dentists are loaded
      this.changeDentists(last.clinic._id || '', () => {
        this.rxform.patchValue({
          dentist: last.dentist?._id || ''
        });
        this.setDentist(last.dentist?._id || '');
        this.setDateAndTime();
      });

    } else {
      const dentistFieldIndex = this.appointmentFields.findIndex(f => f.name === 'dentist');
      // No previous appointment → clear everything except patient
      this.rxform.patchValue({
        clinic: '',
        dentist: '',
        services: [],
        time: ''
      });
      this.dentists = [];
      if (dentistFieldIndex !== -1) {
        this.appointmentFields.splice(dentistFieldIndex, 1);
      }

    }

    this.checkDentist();
  }

  get latestPatientAppointment(): Appointment | undefined {
    const currentAppointmentData = this.patientAppointments[0];
    return currentAppointmentData;
  }

  get safeSelectedDentist(): User {
    return this.selectedDentist || this.emptyDentist;
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
