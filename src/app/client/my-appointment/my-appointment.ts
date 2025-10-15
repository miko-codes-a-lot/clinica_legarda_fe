import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ required for *ngIf and *ngFor
import { AuthService } from '../../_shared/service/auth-service';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { Appointment } from '../../_shared/model/appointment'; // adjust path

@Component({
  selector: 'app-my-appointment',
  imports: [CommonModule],
  templateUrl: './my-appointment.html',
  styleUrl: './my-appointment.css'
})
export class MyAppointment {

  constructor(
    private readonly authService: AuthService,
    private readonly appointmentService: AppointmentService,
  ) {}
//  get all the data in appointments based on ID
// filter only the approved data
  upcomingAppointments = [
    { date: new Date('2025-09-18'), time: '9:00 AM', service: 'Dental Cleaning', dentist: 'Juan Cruz', status: 'Confirmed' },
  ];

  isLoading = false

  upcomingAppointmentsData: Appointment[] = [];

  ngOnInit(): void {
    this.isLoading = true

     this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.appointmentService.getAll(user._id).subscribe({
            next: (data: Appointment[]) => {
              this.upcomingAppointmentsData = data.filter(a => a.status === 'confirmed');
              console.log('this.upcomingAppointmentsData', this.upcomingAppointmentsData)
              this.isLoading = false
            },
            error: (err) => console.error(err)
          });
        }
      }

    })
  }

  rescheduleAppointment(appointment: any) {
    alert(`Reschedule appointment for ${appointment.service} on ${appointment.date.toDateString()}`);
  }

  cancelAppointment(appointment: any) {
    alert(`Cancel appointment for ${appointment.service} on ${appointment.date.toDateString()}`);
  }
}
