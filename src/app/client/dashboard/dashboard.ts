import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
 // Static Data for demonstration
  user = {
    firstName: 'Juan',
    lastName: 'Della Cruz',
    email: 'juan@gmail.com',
    profileImage: 'assets/images/user-profile.jpg'
  };

  upcomingAppointments = [
    {
      service: 'Dental Cleaning',
      date: new Date('2025-10-22'),
      time: '10:00 AM',
      dentist: { firstName: 'Maria', lastName: 'Santos' },
      status: 'Confirmed'
    },
    {
      service: 'General Consultation',
      date: new Date('2025-10-30'),
      time: '09:30 AM',
      dentist: { firstName: 'Jose', lastName: 'Ramirez' },
      status: 'Pending'
    }
  ];

  notifications = [
    { message: 'Patient Juan booked a new appointment', timestamp: new Date('2025-10-15') },
    { message: 'Your appointment with Dr. Maria Santos is confirmed', timestamp: new Date('2025-10-14') },
    { message: 'New service added: Teeth Whitening', timestamp: new Date('2025-10-10') }
  ];

  rescheduleAppointment(appointment: any) {
    alert(`Reschedule ${appointment.service}`);
  }

  cancelAppointment(appointment: any) {
    alert(`Cancel ${appointment.service}`);
  }
}
