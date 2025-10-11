import { Component } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
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
  initDoc!: Appointment

  dentalServices: DentalService[] = []
  clinics: Clinic[] = []
  patients: User[] = []

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly appointmentService: AppointmentService,
    private readonly clinicService: ClinicService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe({
      next: (u) => this.user = u
    })
    if (!this.user) {
      return
    }
    this.isLoading = true

    this.initDoc = this.appointmentService.getEmptyNonNullDoc()
    forkJoin({
      services: this.dentalServicesService.getAll(),
      clinics: this.clinicService.getAll(),
      patients: this.userService.getAll(),
    }).subscribe({
      next: ({ services, clinics, patients }) => {
        this.dentalServices = services
        this.clinics = clinics
        this.patients = patients
      },
      error: (e) => alert(`Something went wrong ${e}`),
      complete: () => this.isLoading = false,
    })
  }

  onSubmit(appointment: AppointmentPayload) {
    this.isLoading = true
    this.appointmentService.create(appointment).subscribe({
      next: (c) => this.router.navigate(['admin/appointment/details', c._id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
