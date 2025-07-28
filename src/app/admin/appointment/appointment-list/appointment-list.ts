import { Component } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../../_shared/model/user';

@Component({
  selector: 'app-appointment-list',
  imports: [RouterLink],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.css'
})
export class AppointmentList {
  isLoading = false

  appointments: Appointment[] = [];

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.appointmentService.getAll().subscribe({
      next: (appointments) => this.appointments = appointments,
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  getName(user: User) {
    return `${user.firstName} ${user.lastName}`
  }

  onCreate() {
    this.router.navigate(['/admin/appointment/create'])
  }

  onDetails(id: string) {
    this.router.navigate(['/admin/appointment/details', id])
  }

  onUpdate(id: string) {
    this.router.navigate(['/admin/appointment/update', id])
  }
}
