import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ required for *ngIf and *ngFor

@Component({
  selector: 'app-my-appointment',
  imports: [CommonModule],
  templateUrl: './my-appointment.html',
  styleUrl: './my-appointment.css'
})
export class MyAppointment {
 upcomingAppointments = [
    { date: new Date('2025-09-18'), time: '9:00 AM', service: 'Dental Cleaning', dentist: 'Juan Cruz', status: 'Confirmed' },
  ];

  rescheduleAppointment(appointment: any) {
    alert(`Reschedule appointment for ${appointment.service} on ${appointment.date.toDateString()}`);
  }

  cancelAppointment(appointment: any) {
    alert(`Cancel appointment for ${appointment.service} on ${appointment.date.toDateString()}`);
  }
}
