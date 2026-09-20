import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, forkJoin, switchMap } from 'rxjs';
import { AppointmentPayload } from '../../../admin/appointment/appointment-payload';
import { AppointmentPage } from '../appointment';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { Clinic } from '../../../_shared/model/clinic';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserSimple } from '../../../_shared/model/user-simple';
import { AuthService } from '../../../_shared/service/auth-service';
import { AlertService } from '../../../_shared/service/alert.service';


@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [CommonModule, AppointmentPage, MatProgressSpinnerModule, RouterLink],
  templateUrl: './appointment-create.html',
  styleUrls: ['./appointment-create.css'],

})
export class AppointmentCreate {
  user: UserSimple | null = null
  isLoading = false
  isInitializing = true
  loadError = false
  private readonly destroyRef = inject(DestroyRef)
  initDoc!: Appointment

  dentalServices: DentalService[] = []
  clinics: Clinic[] = []

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly appointmentService: AppointmentService,
    private readonly clinicService: ClinicService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(
      switchMap(user => {
        this.user = user
        this.loadError = false
        if (!user) {
          this.isInitializing = false
          return EMPTY
        }

        this.isInitializing = true
        this.isLoading = true
        this.initDoc = this.appointmentService.getEmptyNonNullDoc()
        return forkJoin({
          services: this.dentalServicesService.getAll(),
          clinics: this.clinicService.getAll(),
        }).pipe(
          catchError(() => {
            this.loadError = true
            return EMPTY
          }),
          finalize(() => {
            this.isInitializing = false
            this.isLoading = false
          }),
        )
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ services, clinics }) => {
        this.dentalServices = services
        this.clinics = clinics
      },
    })
  }

  onSubmit(appointment: AppointmentPayload) {
    this.isLoading = true

    this.appointmentService.create(appointment).subscribe({
      next: () => this.router.navigate(['/app/my-appointment'], { replaceUrl: true }),
      error: (e) => {
        this.alertService.error(e.error.message)
      }
    }).add(() => this.isLoading = false)
  }
}
