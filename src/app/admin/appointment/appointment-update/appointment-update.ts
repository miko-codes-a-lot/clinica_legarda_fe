import { Component } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { DentalService } from '../../../_shared/model/dental-service';
import { Clinic } from '../../../_shared/model/clinic';
import { User } from '../../../_shared/model/user';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { UserService } from '../../../_shared/service/user-service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AppointmentPayload } from '../appointment-payload';
import { AppointmentForm } from '../appointment-form/appointment-form';

@Component({
  selector: 'app-appointment-update',
  imports: [AppointmentForm],
  templateUrl: './appointment-update.html',
  styleUrl: './appointment-update.css'
})
export class AppointmentUpdate {
  isLoading = false
  id!: string
  appointment?: Appointment

  dentalServices: DentalService[] = []
  clinics: Clinic[] = []
  patients: User[] = []

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly appointmentService: AppointmentService,
    private readonly clinicService: ClinicService,
    private readonly userService: UserService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']

    forkJoin({
      appointment: this.appointmentService.getOne(this.id),
      services: this.dentalServicesService.getAll(),
      clinics: this.clinicService.getAll(),
      patients: this.userService.getAll(),
    }).subscribe({
      next: ({ appointment, services, clinics, patients }) => {
        this.appointment = appointment
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
    this.appointmentService.update(this.id, appointment).subscribe({
      next: (c) => this.router.navigate(['admin/appointment/details', c._id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
