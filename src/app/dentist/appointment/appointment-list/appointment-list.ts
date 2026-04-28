import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { AuthService } from '../../../_shared/service/auth-service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-appointment-list',
  imports: [GenericTableComponent, MatCardModule, CommonModule, MatIconModule],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.css'
})

export class AppointmentList implements OnInit {
  isLoading = false
  moduleUrl = '/dentist/appointment/'
  title = 'Appointment'
  createLabel = 'Create appointment'
  dataSource = new MatTableDataSource<Appointment>();

  Object = Object;

  dailyAppointments: Record<string, Appointment[]> = {};
  dailyDates: string[] = [];

  todayStr: string = ''; // <-- add this

  displayedColumns: string[] = ['_id', 'clinic', 'patient', 'dentist', 'date', 'time', 'status', 'actions'];
  columnDefs = [
    { key: '_id', label: 'ID', cell: (appointment: Appointment) => appointment._id ?? '' },
    { key: 'clinic', label: 'Clinic', cell: (appointment: Appointment) => appointment.clinic.name},
    { key: 'patient', label: 'Patient', cell: (appointment: Appointment) =>  `${appointment.patient.firstName} ${appointment.patient.lastName}` },
    { key: 'dentist', label: 'Dentist', cell: (appointment: Appointment) =>  `${appointment.dentist.firstName} ${appointment.dentist.lastName}` },
    { key: 'date', label: 'Date', cell: (appointment: Appointment) => appointment.date },
    { key: 'time', label: 'Time', cell: (appointment: Appointment) =>  `${appointment.startTime} - ${appointment.endTime}` },
    { key: 'status', label: 'Status', cell: (appointment: Appointment) => appointment.status },
  ];

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true
    const today = new Date();
    today.setHours(0,0,0,0);
    this.todayStr = today.toISOString().split('T')[0]; // set todayStr
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.appointmentService.getAllByDentist(user._id).subscribe({
            next: (data: Appointment[]) => {

            const filteredAppointments = data
              .filter(a => {
                return !a.referral || a.referral.status === 'confirmed';
              })
              .sort((a, b) => {
                const aRaw = a.updatedAt ?? a.createdAt;
                const bRaw = b.updatedAt ?? b.createdAt;

                const aDate = aRaw ? new Date(aRaw).getTime() : 0;
                const bDate = bRaw ? new Date(bRaw).getTime() : 0;

                return bDate - aDate; // latest first
              });

              this.dataSource.data = filteredAppointments;
              console.log('filteredAppointments', filteredAppointments);
              this.prepareDailySummary(filteredAppointments);
              this.isLoading = false
            },
            error: (err) => console.error(err)
          });
        }
      }

    })

    // this.appointmentService.getAll().subscribe({
    //   next: (data) => {
    //     this.dataSource.data = data;
    //   },
    //   error: (e) => alert(`Something went wrong ${e}`)
    // }).add(() => this.isLoading = false);
  }

    // Group appointments by day
  // Initialize

 private prepareDailySummary(appointments: Appointment[]) {
    this.dailyAppointments = {};

    const today = new Date();
    today.setHours(0,0,0,0); // midnight today

    appointments.forEach(app => {
      if (app.status !== 'confirmed') return;

      const appDate = new Date(app.date);
      appDate.setHours(0,0,0,0);

      if (appDate < today) return; // skip past dates

      const year = appDate.getFullYear();
      const month = String(appDate.getMonth() + 1).padStart(2, '0');
      const day = String(appDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (!this.dailyAppointments[dateStr]) {
        this.dailyAppointments[dateStr] = [];
      }
      this.dailyAppointments[dateStr].push(app);
    });

    this.dailyDates = Object.keys(this.dailyAppointments).sort();
  }


  onDetails(id: string) {
    this.router.navigate([`${this.moduleUrl}/details`, id])
  }
}
