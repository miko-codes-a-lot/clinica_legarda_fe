import { Component } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AppointmentPayload } from '../appointment-payload';
import { AppointmentForm } from '../appointment-form/appointment-form';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';

@Component({
  selector: 'app-appointment-create',
  imports: [AppointmentForm],
  templateUrl: './appointment-create.html',
  styleUrl: './appointment-create.css'
})
export class AppointmentCreate {
  isLoading = false
  initDoc!: Appointment
  patients: User[] = []
  dentists: User[] = []
  dentalServices: DentalService[] = []

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly dentalServicesService: DentalServicesService,
    private readonly userService: UserService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.initDoc = this.appointmentService.getEmptyNonNullDoc()

    forkJoin({
      patients: this.userService.getAll(),
      dentists: this.userService.getAll(),
      services: this.dentalServicesService.getAll(),
    }).subscribe({
      next: ({ patients, dentists, services }) => {
        this.patients = patients
        this.dentists = dentists
        this.dentalServices = services
      },
      error: (e) => alert(`Something went wrong ${e}`),
      complete: () => this.isLoading = false,
    })
  }

  onSubmit(appointment: AppointmentPayload) {
    console.log('lol')
    this.isLoading = true
    this.appointmentService.create(appointment).subscribe({
      next: (c) => this.router.navigate(['admin/appointment/details', c._id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
