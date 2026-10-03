import { APPOINTMENT_TABLE_COLUMNS, appointmentTableDate, appointmentTableFilters } from '../../../_shared/component/table/appointment-table-config';
import { TableColumn, TableFilter } from '../../../_shared/component/table/table-model';
import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { appointmentStatusLabel } from '../../../_shared/model/appointment-history';
import { AppointmentClinicOption, filterAppointments } from '../../../_shared/model/appointment-filters';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { Icon } from '../../../_shared/ui/icon/icon';
import { appointmentDateKey, clinicClock, formatAppointmentDate, requiresAppointmentOutcome } from '../appointment-schedule';
import { DentistAppointmentFeed } from '../dentist-appointment-feed';

type StatusFilter = 'all' | AppointmentStatus;

@Component({
  selector: 'app-appointment-list',
  imports: [GenericTableComponent, MatCardModule, CommonModule, Icon],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.css',
  providers: [DentistAppointmentFeed],
})
export class AppointmentList implements OnInit, AfterViewInit {
  readonly statusLabel = appointmentStatusLabel;
  private readonly feed = inject(DentistAppointmentFeed);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private appointments: Appointment[] = [];
  private loadedDentistId = '';
  private reminderNow = new Date();
  readonly outcomeRowClass = (appointment: Appointment): string =>
    requiresAppointmentOutcome(appointment, this.reminderNow) ? 'attention-row' : '';

  isLoading = true;
  errorMessage = '';
  dataSource = new MatTableDataSource<Appointment>();
  dailyAppointments: Record<string, Appointment[]> = {};
  dailyClinicNames: Record<string, string> = {};
  dailyDates: string[] = [];
  todayStr = clinicClock().date;
  selectedStatus: StatusFilter = 'all';
  selectedClinic = 'all';
  clinicOptions: AppointmentClinicOption[] = [];
  readonly statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' }, { value: AppointmentStatus.PENDING, label: 'Pending' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' }, { value: AppointmentStatus.CANCELLED, label: 'Cancelled' },
    { value: AppointmentStatus.REJECTED, label: 'Rejected' },
    { value: AppointmentStatus.COMPLETED, label: 'Completed' }, { value: AppointmentStatus.NO_SHOW, label: 'No show' },
  ];
  statusCounts: Record<StatusFilter, number> = { all: 0, pending: 0, confirmed: 0, cancelled: 0, rejected: 0, completed: 0, no_show: 0 };

  displayedColumns = ['patient', 'clinic', 'date', 'time', 'visitType', 'status', 'actions'];
  columnDefs: readonly TableColumn<Appointment>[] = APPOINTMENT_TABLE_COLUMNS.map(column => column.key === 'status'
    ? { ...column, cell: (appointment: Appointment) => appointmentStatusLabel(appointment.status) + (requiresAppointmentOutcome(appointment, this.reminderNow) ? ' · Outcome required' : '') } : column);
  readonly dateValue = appointmentTableDate;
  filters: TableFilter<Appointment>[] = [];

  ngOnInit(): void {
    this.feed.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      this.reminderNow = new Date();
      if (this.loadedDentistId !== state.dentistId) {
        this.loadedDentistId = state.dentistId;
        this.selectedClinic = 'all';
        this.selectedStatus = 'all';
        this.clinicOptions = [];
        this.dataSource.filter = '';
        this.dataSource.paginator?.firstPage();
        this.errorMessage = '';
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
    this.feed.clinicOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(options => {
      this.clinicOptions = options;
      if (this.selectedClinic !== 'all' && !options.some(option => option.id === this.selectedClinic)) {
        this.selectClinic('all');
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
    this.applyFilters();
    this.dataSource.paginator?.firstPage();
  }

  selectClinic(clinicId: string): void {
    this.selectedClinic = clinicId;
    this.applyFilters();
    this.dataSource.paginator?.firstPage();
  }

  refresh(): void {
    this.feed.refresh();
  }

  onDetails(id: string): void {
    this.router.navigate(['/dentist/appointment/details', id]);
  }

  private updateAppointments(appointments: Appointment[]): void {
    this.filters = appointmentTableFilters(appointments);
    this.appointments = [...appointments].sort((a, b) => {
      const aDate = a.updatedAt ?? a.createdAt ?? '';
      const bDate = b.updatedAt ?? b.createdAt ?? '';
      return bDate.localeCompare(aDate);
    });
    this.applyFilters();
  }

  private applyFilters(): void {
    const appointments = filterAppointments(this.appointments, this.selectedClinic);
    this.statusCounts = { all: appointments.length, pending: 0, confirmed: 0, cancelled: 0, rejected: 0, completed: 0, no_show: 0 };
    for (const appointment of appointments) this.statusCounts[appointment.status]++;
    this.dataSource.data = filterAppointments(appointments, 'all', this.selectedStatus);
    this.prepareDailySummary(appointments);
  }

  private prepareDailySummary(appointments: Appointment[]): void {
    this.dailyAppointments = {};
    this.dailyClinicNames = {};
    this.todayStr = clinicClock().date;
    for (const appointment of appointments) {
      const date = appointmentDateKey(appointment.date);
      if (appointment.status !== AppointmentStatus.CONFIRMED || date < this.todayStr) continue;
      (this.dailyAppointments[date] ??= []).push(appointment);
    }
    this.dailyDates = Object.keys(this.dailyAppointments).sort();
    for (const date of this.dailyDates) {
      this.dailyClinicNames[date] = [...new Set(this.dailyAppointments[date].map(appointment => appointment.clinic.name))].join(', ');
    }
  }
}
