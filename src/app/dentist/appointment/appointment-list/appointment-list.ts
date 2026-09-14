import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { appointmentDateKey, clinicClock, formatAppointmentDate } from '../appointment-schedule';
import { DentistAppointmentFeed } from '../dentist-appointment-feed';

type StatusFilter = 'all' | AppointmentStatus;

@Component({
  selector: 'app-appointment-list',
  imports: [GenericTableComponent, MatCardModule, CommonModule, MatIconModule],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.css',
  providers: [DentistAppointmentFeed],
})
export class AppointmentList implements OnInit, AfterViewInit {
  private readonly feed = inject(DentistAppointmentFeed);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private appointments: Appointment[] = [];
  private loadedDentistId = '';

  isLoading = true;
  errorMessage = '';
  dataSource = new MatTableDataSource<Appointment>();
  dailyAppointments: Record<string, Appointment[]> = {};
  dailyDates: string[] = [];
  todayStr = clinicClock().date;
  selectedStatus: StatusFilter = 'all';
  readonly statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' }, { value: AppointmentStatus.PENDING, label: 'Pending' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' }, { value: AppointmentStatus.CANCELLED, label: 'Cancelled' },
    { value: AppointmentStatus.REJECTED, label: 'Rejected' },
  ];
  statusCounts: Record<StatusFilter, number> = { all: 0, pending: 0, confirmed: 0, cancelled: 0, rejected: 0 };

  displayedColumns = ['_id', 'clinic', 'patient', 'dentist', 'date', 'time', 'status', 'actions'];
  columnDefs = [
    { key: '_id', label: 'ID', cell: (appointment: Appointment) => appointment._id ?? '' },
    { key: 'clinic', label: 'Clinic', cell: (appointment: Appointment) => appointment.clinic.name },
    { key: 'patient', label: 'Patient', cell: (appointment: Appointment) => `${appointment.patient.firstName} ${appointment.patient.lastName}` },
    { key: 'dentist', label: 'Dentist', cell: (appointment: Appointment) => `${appointment.dentist.firstName} ${appointment.dentist.lastName}` },
    { key: 'date', label: 'Date', cell: (appointment: Appointment) => formatAppointmentDate(appointment.date) },
    { key: 'time', label: 'Time', cell: (appointment: Appointment) => `${appointment.startTime} - ${appointment.endTime}` },
    { key: 'status', label: 'Status', cell: (appointment: Appointment) => appointment.status },
  ];

  ngOnInit(): void {
    this.feed.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      if (this.loadedDentistId !== state.dentistId) {
        this.loadedDentistId = state.dentistId;
        this.updateAppointments([]);
      }
      this.isLoading = state.kind === 'loading';
      if (state.kind === 'loaded') {
        this.errorMessage = '';
        this.updateAppointments(state.appointments);
      } else if (state.kind === 'error') {
        this.errorMessage = state.message;
      }
    });
  }

  ngAfterViewInit(): void {
    const accessor = this.dataSource.sortingDataAccessor;
    this.dataSource.sortingDataAccessor = (appointment, column) => column === 'date'
      ? appointmentDateKey(appointment.date) : accessor(appointment, column);
  }

  selectStatus(status: StatusFilter): void {
    this.selectedStatus = status;
    this.applyStatusFilter();
    this.dataSource.paginator?.firstPage();
  }

  refresh(): void {
    this.feed.refresh();
  }

  onDetails(id: string): void {
    this.router.navigate(['/dentist/appointment/details', id]);
  }

  private updateAppointments(appointments: Appointment[]): void {
    this.appointments = [...appointments].sort((a, b) => {
      const aDate = a.updatedAt ?? a.createdAt ?? '';
      const bDate = b.updatedAt ?? b.createdAt ?? '';
      return bDate.localeCompare(aDate);
    });
    this.statusCounts = { all: appointments.length, pending: 0, confirmed: 0, cancelled: 0, rejected: 0 };
    for (const appointment of appointments) this.statusCounts[appointment.status]++;
    this.applyStatusFilter();
    this.prepareDailySummary(appointments);
  }

  private applyStatusFilter(): void {
    this.dataSource.data = this.selectedStatus === 'all' ? this.appointments
      : this.appointments.filter(appointment => appointment.status === this.selectedStatus);
  }

  private prepareDailySummary(appointments: Appointment[]): void {
    this.dailyAppointments = {};
    this.todayStr = clinicClock().date;
    for (const appointment of appointments) {
      const date = appointmentDateKey(appointment.date);
      if (appointment.status !== AppointmentStatus.CONFIRMED || date < this.todayStr) continue;
      (this.dailyAppointments[date] ??= []).push(appointment);
    }
    this.dailyDates = Object.keys(this.dailyAppointments).sort();
  }
}
