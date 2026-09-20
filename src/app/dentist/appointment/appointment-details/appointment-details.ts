import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, interval, Observable, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../_shared/service/auth-service';
import { canCancelAppointment } from '../../../_shared/model/appointment-permissions';
import { Appointment } from '../../../_shared/model/appointment';
import { appointmentActorLabel, appointmentStatusLabel, isAppointmentHistory } from '../../../_shared/model/appointment-history';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { NotesDialogComponent } from '../../../_shared/component/dialog/notes-dialog/notes-dialog.component';
import { AppointmentReasonDialogComponent, AppointmentReasonDialogData } from '../../../_shared/component/dialog/appointment-reason-dialog/appointment-reason-dialog.component';
import { ConfirmDialogComponent } from '../../../_shared/component/dialog/confirm-dialog/confirm-dialog.component';
import { RescheduleDialogComponent, RescheduleDialogData, RescheduleDialogResult } from '../../../_shared/component/dialog/reschedule-dialog/reschedule-dialog.component';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { MatTableDataSource } from '@angular/material/table';
import { AlertService } from '../../../_shared/service/alert.service';
import { compareAppointmentSchedule, formatAppointmentDate, requiresAppointmentOutcome } from '../appointment-schedule';

@Component({
  selector: 'app-appointment-details',
  imports: [ListComponent, MatListModule, MatButtonModule, MatIconModule, CommonModule, GenericTableComponent],
  templateUrl: './appointment-details.html',
  styleUrl: './appointment-details.css',
})
export class AppointmentDetails {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  isLoading = false;
  isSaving = false;
  isDialogOpen = false;
  actionError = '';
  readonly actorLabel = appointmentActorLabel;
  readonly requiresOutcome = requiresAppointmentOutcome;
  reminderNow = new Date();
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
    { key: 'status', label: 'Status', cell: (appointment: Appointment) => appointmentStatusLabel(appointment.status) },
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
    interval(30_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reminderNow = new Date());
  }

  loadAppointment(): void {
    if (this.isBusy) return;
    this.isLoading = true;
    this.loadError = '';
    this.actionError = '';
    this.historyError = '';
    this.id = this.route.snapshot.params['id'];
    this.appointmentService.getOne(this.id).pipe(
      tap(appointment => this.setAppointment(appointment)),
      switchMap(appointment => this.loadHistory(appointment)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading = false),
    ).subscribe({
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
    this.requestReason('reject');
  }

  openNotesDialog(): void {
    if (!this.appointment || this.isClinicNotesDisabled()) return;
    const appointmentId = this.appointment._id;
    this.isDialogOpen = true;
    this.dialog.open<NotesDialogComponent, { clinicNotes: string }, string>(NotesDialogComponent, {
      data: { clinicNotes: this.appointment.notes.clinicNotes },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(notes => {
      this.isDialogOpen = false;
      if (notes !== undefined) {
        this.saveAppointment(this.appointmentService.updateDentistNotes(appointmentId, notes), 'Clinic notes updated successfully!');
      }
    });
  }

  isActionDisabled(): boolean {
    return this.isBusy || !this.appointment || this.appointment.status !== 'pending';
  }

  isClinicNotesDisabled(): boolean {
    return this.isBusy || !this.appointment || ['rejected', 'cancelled'].includes(this.appointment.status);
  }

  get isBusy(): boolean {
    return this.isLoading || this.isDialogOpen;
  }

  get isActive(): boolean {
    return this.appointment?.status === 'pending' || this.appointment?.status === 'confirmed';
  }

  get canCancel(): boolean {
    return canCancelAppointment(this.appointment, this.authService.currentUserValue?._id);
  }

  cancelAppointment(): void {
    if (!this.canCancel || this.isBusy) return;
    this.requestReason('cancel');
  }

  private requestReason(action: 'cancel' | 'reject'): void {
    if (!this.appointment) return;
    const appointmentId = this.appointment._id;
    this.isDialogOpen = true;
    this.dialog.open<AppointmentReasonDialogComponent, AppointmentReasonDialogData, string>(AppointmentReasonDialogComponent, {
      width: '460px', maxWidth: '95vw', data: { action },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(reason => {
      this.isDialogOpen = false;
      if (reason?.trim()) {
        const request = action === 'cancel'
          ? this.appointmentService.cancelAppointment(appointmentId, reason.trim())
          : this.appointmentService.rejectAppointment(appointmentId, reason.trim());
        this.saveAppointment(request, action === 'cancel' ? 'Appointment cancelled successfully!' : 'Appointment rejected successfully!');
      }
    });
  }

  completeAppointment(): void {
    this.confirmOutcome('completed');
  }

  noShowAppointment(): void {
    this.confirmOutcome('no_show');
  }

  rescheduleAppointment(): void {
    if (!this.appointment || !this.isActive || this.isBusy) return;
    const appointment = this.appointment;
    this.isDialogOpen = true;
    this.dialog.open<RescheduleDialogComponent, RescheduleDialogData, RescheduleDialogResult>(RescheduleDialogComponent, {
      width: '560px', maxWidth: '95vw',
      data: {
        appointmentId: appointment._id, clinic: appointment.clinic, dentist: appointment.dentist,
        date: appointment.date, startTime: appointment.startTime, endTime: appointment.endTime,
      },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.isDialogOpen = false;
      if (result) {
        this.saveAppointment(this.appointmentService.rescheduleAppointment(appointment._id, result),
          'Appointment rescheduled and awaiting approval.');
      }
    });
  }

  private confirmOutcome(outcome: 'completed' | 'no_show'): void {
    if (!this.appointment || this.appointment.status !== 'confirmed' || this.isBusy) return;
    const appointmentId = this.appointment._id;
    const message = outcome === 'completed'
      ? 'Mark this appointment as completed? Confirm that the patient attended and the visit is finished. This final outcome cannot be changed or rescheduled. Clinical notes and history will remain available.'
      : 'Mark this appointment as no show? Confirm that the patient did not attend. This final outcome cannot be changed or rescheduled. Clinical notes and history will remain available.';
    this.isDialogOpen = true;
    this.dialog.open<ConfirmDialogComponent, { message: string }, boolean>(ConfirmDialogComponent, {
      width: '460px', maxWidth: '95vw', data: { message },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      this.isDialogOpen = false;
      if (confirmed === true) {
        const request = outcome === 'completed'
          ? this.appointmentService.completeAppointment(appointmentId)
          : this.appointmentService.noShowAppointment(appointmentId);
        this.saveAppointment(request, outcome === 'completed'
          ? 'Appointment completed successfully!' : 'Appointment marked as no show.');
      }
    });
  }

  private setAppointment(appointment: Appointment): void {
    this.reminderNow = new Date();
    this.appointment = appointment;
    this.displayAppointment = {
      status: appointmentStatusLabel(appointment.status), date: formatAppointmentDate(appointment.date),
      time: `${appointment.startTime} - ${appointment.endTime}`,
      clinic: appointment.clinic.name, clinicAddress: appointment.clinic.address,
      dentist: `${appointment.dentist.firstName} ${appointment.dentist.lastName}`,
      patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    };
  }

  private saveAppointment(request: Observable<Appointment>, successMessage: string): void {
    if (this.isBusy) return;
    this.isLoading = true;
    this.isSaving = true;
    this.actionError = '';
    request.pipe(
      tap(appointment => {
        // Retain populated referral details for older API responses containing only its ID.
        const referral = typeof appointment.referral === 'string' ? this.appointment?.referral : appointment.referral;
        this.setAppointment({ ...appointment, referral });
        this.setHistory([...this.appointmentHistory.filter(previous => previous._id !== appointment._id), appointment]);
        this.alertService.success(successMessage);
      }),
      switchMap(appointment => this.loadHistory(appointment)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.isLoading = false; this.isSaving = false; }),
    ).subscribe({
      error: () => {
        this.actionError = 'The appointment could not be updated. Your current details are still shown. Please try the action again.';
        this.alertService.error(this.actionError);
      },
    });
  }

  private loadHistory(appointment: Appointment): Observable<Appointment[]> {
    this.historyError = '';
    return this.appointmentService.getAll(appointment.patient._id).pipe(
      tap(appointments => this.setHistory(appointments)),
      catchError(() => {
        this.historyError = 'Previous appointments could not be refreshed. Please try again.';
        return of(this.appointmentHistory);
      }),
    );
  }

  private setHistory(appointments: Appointment[]): void {
    this.appointmentHistory = appointments.filter(appointment =>
      appointment.patient._id === this.appointment?.patient._id && isAppointmentHistory(appointment),
    ).sort((a, b) => compareAppointmentSchedule(b, a));
    this.dataSource.data = this.appointmentHistory;
  }
}
