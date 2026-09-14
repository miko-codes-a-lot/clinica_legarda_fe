import { AfterViewInit, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { catchError, EMPTY, finalize, forkJoin, startWith, Subject, switchMap } from 'rxjs';
import { Appointment, AppointmentStatus } from '../model/appointment';
import { Clinic } from '../model/clinic';
import { filterAppointments } from '../model/appointment-filters';
import { AppointmentService } from '../service/appointment-service';
import { ClinicService } from '../service/clinic-service';
import { GenericTableComponent } from '../component/table/generic-table.component';
import { appointmentDateKey, formatAppointmentDate } from '../../dentist/appointment/appointment-schedule';

@Component({
  selector: 'app-staff-appointment-list',
  imports: [GenericTableComponent, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './staff-appointment-list.html',
  styleUrl: './staff-appointment-list.css',
})
export class StaffAppointmentList implements OnInit, AfterViewInit {
  @Input() area: 'admin' | 'super-admin' = 'admin';
  private readonly destroyRef = inject(DestroyRef);
  private readonly appointmentService = inject(AppointmentService);
  private readonly clinicService = inject(ClinicService);
  private readonly router = inject(Router);
  private readonly refreshRequests = new Subject<void>();
  private appointments: Appointment[] = [];

  isLoading = true;
  loadError = '';
  clinics: Clinic[] = [];
  selectedClinic = 'all';
  selectedStatus: 'all' | AppointmentStatus = 'all';
  readonly dataSource = new MatTableDataSource<Appointment>();
  readonly statuses = [
    { value: AppointmentStatus.PENDING, label: 'Pending' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' },
    { value: AppointmentStatus.COMPLETED, label: 'Completed' },
    { value: AppointmentStatus.NO_SHOW, label: 'No show' },
    { value: AppointmentStatus.CANCELLED, label: 'Cancelled' },
    { value: AppointmentStatus.REJECTED, label: 'Rejected' },
  ];
  readonly displayedColumns = ['_id', 'clinic', 'patient', 'dentist', 'date', 'time', 'status', 'actions'];
  readonly columnDefs = [
    { key: '_id', label: 'ID', cell: (appointment: Appointment) => appointment._id },
    { key: 'clinic', label: 'Clinic', cell: (appointment: Appointment) => appointment.clinic?.name || 'Unknown clinic' },
    { key: 'patient', label: 'Patient', cell: (appointment: Appointment) => this.personName(appointment.patient) },
    { key: 'dentist', label: 'Dentist', cell: (appointment: Appointment) => this.personName(appointment.dentist) },
    { key: 'date', label: 'Date', cell: (appointment: Appointment) => formatAppointmentDate(appointment.date) },
    { key: 'time', label: 'Time', cell: (appointment: Appointment) => `${appointment.startTime} - ${appointment.endTime}` },
    { key: 'status', label: 'Status', cell: (appointment: Appointment) =>
      this.statuses.find(status => status.value === appointment.status)?.label || appointment.status },
  ];
  readonly disableEdit = (appointment: Appointment) => appointment.status !== AppointmentStatus.PENDING;

  ngOnInit(): void {
    this.refreshRequests.pipe(
      startWith(undefined),
      switchMap(() => {
        this.isLoading = true;
        this.loadError = '';
        return forkJoin({
          appointments: this.appointmentService.getAll(),
          clinics: this.clinicService.getAll(),
        }).pipe(
          catchError(() => {
            this.loadError = 'Appointments could not be loaded. Please retry.';
            return EMPTY;
          }),
          finalize(() => this.isLoading = false),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ appointments, clinics }) => {
      this.appointments = appointments;
      this.clinics = clinics;
      if (this.selectedClinic !== 'all' && !clinics.some(clinic => clinic._id === this.selectedClinic)) {
        this.selectedClinic = 'all';
      }
      this.applyFilters();
    });
  }

  ngAfterViewInit(): void {
    const accessor = this.dataSource.sortingDataAccessor;
    this.dataSource.sortingDataAccessor = (appointment, column) => column === 'date'
      ? appointmentDateKey(appointment.date) : accessor(appointment, column);
  }

  selectClinic(clinic: string): void {
    this.selectedClinic = clinic;
    this.applyFilters();
  }

  selectStatus(status: 'all' | AppointmentStatus): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  private applyFilters(): void {
    this.dataSource.data = filterAppointments(this.appointments, this.selectedClinic, this.selectedStatus);
    this.dataSource.paginator?.firstPage();
  }

  refresh(): void { this.refreshRequests.next(); }
  onDetails(id: string): void { void this.router.navigate([`/${this.area}/appointment/details`, id]); }
  onUpdate(id: string): void { void this.router.navigate([`/${this.area}/appointment/update`, id]); }
  onCreate(): void { void this.router.navigate([`/${this.area}/appointment/create`]); }

  private personName(person?: { firstName?: string; lastName?: string }): string {
    return [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'Unknown';
  }
}
