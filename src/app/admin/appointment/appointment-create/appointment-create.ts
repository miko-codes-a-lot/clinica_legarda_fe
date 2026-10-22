import { EmptyState } from '../../../_shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../_shared/ui/page-header/page-header';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Appointment } from '../../../_shared/model/appointment';
import { PatientDirectoryEntry } from '../../../_shared/model/user-directory';
import { UserService } from '../../../_shared/service/user-service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AppointmentPayload } from '../appointment-payload';
import { AppointmentForm } from '../appointment-form/appointment-form';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { Clinic } from '../../../_shared/model/clinic';
import { AlertService } from '../../../_shared/service/alert.service';
import { AuthService } from '../../../_shared/service/auth-service';
import { assignedClinicIds } from '../../../_shared/model/user';
import { CareApiService, careError } from '../../../care/care-api.service';
import { linkedCaseAppointment } from '../../../care/linked-case-appointment';

@Component({
  selector: 'app-appointment-create',
  imports: [EmptyState, PageHeader, AppointmentForm],
  templateUrl: './appointment-create.html',
  styleUrl: './appointment-create.css'
})
export class AppointmentCreate {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly careApi = inject(CareApiService);
  private readonly auth = inject(AuthService);
  loadError = ''
  isLoading = false
  initDoc!: Appointment

  dentalServices: DentalService[] = []
  clinics: Clinic[] = []
  patients: PatientDirectoryEntry[] = []
  caseTitle = ''

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly appointmentService: AppointmentService,
    private readonly clinicService: ClinicService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.initDoc = this.appointmentService.getEmptyNonNullDoc()
    const caseId = this.route.snapshot.queryParamMap?.get('careCase');

    forkJoin({
      services: this.dentalServicesService.getAll(),
      clinics: this.clinicService.getAccessible(),
      patients: this.userService.getPatients(),
      caseDetail: caseId ? this.careApi.treatmentCase(caseId) : of(null),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ services, clinics, patients, caseDetail }) => {
        const user = this.auth.currentUserValue;
        const assigned = user ? assignedClinicIds(user) : [];
        const availableClinics = clinics.filter(clinic => user?.role !== 'dentist' || (!!clinic._id && assigned.includes(clinic._id)));
        this.dentalServices = services
        this.clinics = availableClinics
        this.patients = patients
        if (caseDetail) {
          try { this.initDoc = linkedCaseAppointment(this.initDoc, caseDetail.careCase, availableClinics, patients); this.caseTitle = caseDetail.careCase.title; }
          catch (error) { this.loadError = error instanceof Error ? error.message : careError(error); }
        }
      },
      error: (e) => {
        this.isLoading = false
        this.loadError = 'Unable to load appointment options.'
        this.alertService.error(`Something went wrong ${e}`)
      },
      complete: () => this.isLoading = false,
    })
  }

  onSubmit(appointment: AppointmentPayload) {
    this.isLoading = true
    this.appointmentService.create(appointment).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (c) => this.router.navigate([`/${this.router.url.split('/')[1]}/appointment/details`, c._id], { replaceUrl: true }),
      error: (e) => this.alertService.error(e.error?.message || 'Something went wrong')
    }).add(() => this.isLoading = false)
  }
}
