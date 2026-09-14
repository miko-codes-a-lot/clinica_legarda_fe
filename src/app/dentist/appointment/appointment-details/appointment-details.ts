import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, Observable, of, switchMap, tap } from 'rxjs';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { NotesDialogComponent } from '../../../_shared/component/dialog/notes-dialog/notes-dialog.component';
import { CancelAppointmentDialogComponent } from '../../../_shared/component/dialog/cancel-appointment-dialog/cancel-appointment-dialog.component';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { MatTableDataSource } from '@angular/material/table';
import { AlertService } from '../../../_shared/service/alert.service';
import { appointmentDateKey, clinicClock, compareAppointmentSchedule, formatAppointmentDate } from '../appointment-schedule';

@Component({
  selector: 'app-appointment-details',
  imports: [ListComponent, MatListModule, MatButtonModule, MatIconModule, CommonModule, GenericTableComponent],
  templateUrl: './appointment-details.html',
  styleUrl: './appointment-details.css',
})
export class AppointmentDetails {
  private readonly destroyRef = inject(DestroyRef);
  isLoading = false;
  id = '';
  appointment?: Appointment;
  appointmentHistory: Appointment[] = [];
  displayAppointment: Record<string, string> = {};
  dataSource = new MatTableDataSource<Appointment>();
  loadError = '';
  historyError = '';

  displayedColumns = ['clinic', 'services', 'patient', 'dentist', 'date', 'time', 'status', 'notes.clinicNotes', 'notes.patientNotes'];
  columnDefs = [
    { key: 'clinic', label: 'Clinic', cell: (appointment: Appointment) => appointment.clinic.name },
    { key: 'services', label: 'Services', cell: (appointment: Appointment) => appointment.services.map(service => service.name).join(', ') },
    { key: 'patient', label: 'Patient', cell: (appointment: Appointment) => `${appointment.patient.firstName} ${appointment.patient.lastName}` },
    { key: 'dentist', label: 'Dentist', cell: (appointment: Appointment) => `${appointment.dentist.firstName} ${appointment.dentist.lastName}` },
    { key: 'date', label: 'Date', cell: (appointment: Appointment) => formatAppointmentDate(appointment.date) },
    { key: 'time', label: 'Time', cell: (appointment: Appointment) => `${appointment.startTime} - ${appointment.endTime}` },
    { key: 'status', label: 'Status', cell: (appointment: Appointment) => appointment.status },
    { key: 'notes.clinicNotes', label: 'Clinic Notes', cell: (appointment: Appointment) => appointment.notes.clinicNotes },
    { key: 'notes.patientNotes', label: 'Patient Notes', cell: (appointment: Appointment) => appointment.notes.patientNotes },
  ];

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.loadAppointment();
  }

  loadAppointment(): void {
    this.isLoading = true;
    this.loadError = '';
    this.historyError = '';
    this.id = this.route.snapshot.params['id'];
    this.appointmentService.getOne(this.id).pipe(
      tap(appointment => this.setAppointment(appointment)),
      switchMap(appointment => this.appointmentService.getAll(appointment.patient._id).pipe(
        catchError(() => {
          this.historyError = 'Previous appointments could not be loaded.';
          return of([]);
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading = false),
    ).subscribe({
      next: appointments => {
        const now = clinicClock();
        this.appointmentHistory = appointments.filter(appointment => {
          const date = appointmentDateKey(appointment.date);
          return appointment.patient._id === this.appointment?.patient._id && appointment.status === 'confirmed' &&
            (date < now.date || (date === now.date && appointment.endTime < now.time));
        }).sort((a, b) => compareAppointmentSchedule(b, a));
        this.dataSource.data = this.appointmentHistory;
      },
      error: () => this.loadError = 'Appointment details could not be loaded. Please try again.',
    });
  }

  onUpdate(): void {
    this.router.navigate(['/dentist/appointment/update', this.id]);
  }

  approveAppointment(): void {
    if (!this.appointment || this.isActionDisabled()) return;
    this.saveAppointment(this.appointmentService.approveAppointment(this.appointment._id), 'Appointment approved successfully!');
  }

  declineAppointment(): void {
    if (!this.appointment || this.isActionDisabled()) return;
    this.saveAppointment(this.appointmentService.rejectAppointment(this.appointment._id), 'Appointment rejected successfully!');
  }

  openNotesDialog(): void {
    if (!this.appointment || this.isClinicNotesDisabled()) return;
    const appointmentId = this.appointment._id;
    this.dialog.open<NotesDialogComponent, { clinicNotes: string }, string>(NotesDialogComponent, {
      data: { clinicNotes: this.appointment.notes.clinicNotes },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(notes => {
      if (notes !== undefined) {
        this.saveAppointment(this.appointmentService.updateDentistNotes(appointmentId, notes), 'Clinic notes updated successfully!');
      }
    });
  }

  isActionDisabled(): boolean {
    return this.isLoading || !this.appointment || this.appointment.status !== 'pending';
  }

  isClinicNotesDisabled(): boolean {
    return this.isLoading || !this.appointment || ['rejected', 'cancelled'].includes(this.appointment.status);
  }

  cancelAppointment(): void {
    if (!this.appointment || this.appointment.status !== 'confirmed' || this.isLoading) return;
    const appointmentId = this.appointment._id;
    this.dialog.open<CancelAppointmentDialogComponent, undefined, string>(CancelAppointmentDialogComponent, {
      width: '460px', maxWidth: '95vw',
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(reason => {
      if (reason?.trim()) {
        this.saveAppointment(this.appointmentService.cancelAppointment(appointmentId, reason.trim()), 'Appointment cancelled successfully!');
      }
    });
  }

  private setAppointment(appointment: Appointment): void {
    this.appointment = appointment;
    this.displayAppointment = {
      status: appointment.status, date: formatAppointmentDate(appointment.date),
      time: `${appointment.startTime} - ${appointment.endTime}`,
      clinic: appointment.clinic.name, clinicAddress: appointment.clinic.address,
      dentist: `${appointment.dentist.firstName} ${appointment.dentist.lastName}`,
      patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    };
  }

  private saveAppointment(request: Observable<Appointment>, successMessage: string): void {
    this.isLoading = true;
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isLoading = false)).subscribe({
      next: appointment => {
        // Status/notes responses contain only the referral ID; these actions do not change the referral.
        const referral = typeof appointment.referral === 'string' ? this.appointment?.referral : appointment.referral;
        this.setAppointment({ ...appointment, referral });
        this.alertService.success(successMessage);
      },
      error: () => this.alertService.error('The appointment could not be updated. Please try again.'),
    });
  }
}
