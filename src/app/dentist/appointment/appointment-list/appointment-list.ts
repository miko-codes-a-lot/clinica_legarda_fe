import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';

@Component({
  selector: 'app-appointment-list',
  imports: [GenericTableComponent],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.css'
})

export class AppointmentList implements OnInit {
  isLoading = false
  moduleUrl = '/admin/appointment/'
  title = 'Appointment'
  createLabel = 'Create appointment'
  dataSource = new MatTableDataSource<Appointment>();
  displayedColumns: string[] = ['_id', 'clinic', 'patient', 'dentist', 'date', 'time', 'actions'];
  columnDefs = [
    { key: '_id', label: 'ID', cell: (appointment: Appointment) => appointment._id ?? '' },
    { key: 'clinic', label: 'Clinic', cell: (appointment: Appointment) => appointment.clinic.name},
    { key: 'patient', label: 'Patient', cell: (appointment: Appointment) =>  `${appointment.patient.firstName} ${appointment.patient.lastName}` },
    { key: 'dentist', label: 'Dentist', cell: (appointment: Appointment) =>  `${appointment.dentist.firstName} ${appointment.dentist.lastName}` },
    { key: 'date', label: 'Date', cell: (appointment: Appointment) => appointment.date },
    { key: 'time', label: 'Time', cell: (appointment: Appointment) =>  `${appointment.startTime} - ${appointment.endTime}` },
  ];

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.appointmentService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false);
  }

  onDetails(id: string) {
    this.router.navigate([`${this.moduleUrl}/details`, id])
  }

  onUpdate(id: string) {
    this.router.navigate([`${this.moduleUrl}/update`, id])
  }

  onCreate() {
    this.router.navigate([`${this.moduleUrl}/create`])
  }

}
