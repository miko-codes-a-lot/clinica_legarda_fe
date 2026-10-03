import { APPOINTMENT_TABLE_COLUMNS, appointmentTableDate, appointmentTableFilters } from '../component/table/appointment-table-config';
import { TableFilter } from '../component/table/table-model';
import { AfterViewInit, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { catchError, distinctUntilChanged, EMPTY, finalize, forkJoin, map, startWith, Subject, switchMap } from 'rxjs';
import { Appointment, AppointmentStatus } from '../model/appointment';
import { Clinic } from '../model/clinic';
import { filterAppointments } from '../model/appointment-filters';
import { AppointmentService } from '../service/appointment-service';
import { AuthService } from '../service/auth-service';
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
  private readonly authService = inject(AuthService);
  private readonly clinicService = inject(ClinicService);
  private readonly router = inject(Router);
  private readonly refreshRequests = new Subject<void>();
  private appointments: Appointment[] = [];

  isLoading = true;
  loadError = '';
  clinics: Clinic[] = [];
  selectedClinic = 'all';
  selectedStatus: 'all' | AppointmentStatus = 'all';
  get allClinicsLabel(): string { return this.area === 'admin' ? 'All assigned clinics' : 'All clinics'; }
  get scopeDescription(): string {
    return this.area === 'admin'
      ? 'Review appointments in your currently assigned clinics and filter by clinic or status.'
      : 'Review appointment requests and filter by clinic or status.';
  }
  readonly dataSource = new MatTableDataSource<Appointment>();
  readonly statuses = [
    { value: AppointmentStatus.PENDING, label: 'Pending' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' },
    { value: AppointmentStatus.COMPLETED, label: 'Completed' },
    { value: AppointmentStatus.NO_SHOW, label: 'No show' },
    { value: AppointmentStatus.CANCELLED, label: 'Cancelled' },
    { value: AppointmentStatus.REJECTED, label: 'Rejected' },
  ];
  readonly displayedColumns = ['patient', 'clinic', 'date', 'time', 'visitType', 'status', 'actions'];
  readonly columnDefs = APPOINTMENT_TABLE_COLUMNS;
  readonly dateValue = appointmentTableDate;
  filters: TableFilter<Appointment>[] = [];
  scopeKey = '';
  resetFilters(): void { this.selectedClinic = 'all'; this.selectedStatus = 'all'; this.applyFilters(); }
  readonly disableEdit = (appointment: Appointment) => appointment.status !== AppointmentStatus.PENDING;

  ngOnInit(): void {
    this.authService.currentUser$.pipe(
      map(user => ({ id: user?._id ?? '', role: user?.role ?? '' })),
      distinctUntilChanged((previous, current) => previous.id === current.id && previous.role === current.role),
      switchMap(actor => {
        this.scopeKey = `${actor.id}:${actor.role}`;
        this.appointments = [];
        this.clinics = [];
        this.selectedClinic = 'all';
        this.selectedStatus = 'all';
        this.dataSource.filter = '';
        this.loadError = '';
        this.isLoading = false;
        this.applyFilters();
        if (!actor.id || (actor.role !== 'admin' && actor.role !== 'super-admin')) return EMPTY;

        return this.refreshRequests.pipe(
          startWith(undefined),
          switchMap(() => {
            this.isLoading = true;
            this.loadError = '';
            return forkJoin({
              appointments: this.appointmentService.getAll(),
              clinics: this.clinicService.getAccessible(),
            }).pipe(
              catchError(() => {
                this.appointments = [];
                this.clinics = [];
                this.selectedClinic = 'all';
                this.applyFilters();
                this.loadError = 'Appointments could not be loaded. Please retry.';
                return EMPTY;
              }),
              finalize(() => this.isLoading = false),
            );
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ appointments, clinics }) => {
      this.appointments = clinics.length === 0 ? [] : appointments;
      this.filters = appointmentTableFilters(this.appointments);
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

  selectStatus(status: string): void {
    if (status !== 'all' && !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) return;
    this.selectedStatus = status as 'all' | AppointmentStatus;
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
