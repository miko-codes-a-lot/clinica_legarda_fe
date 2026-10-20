import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, interval, Observable } from 'rxjs';
import { Appointment } from '../../model/appointment';
import { AppointmentService } from '../../service/appointment-service';
import { AlertService } from '../../service/alert.service';
import { ConfirmDialogComponent } from '../dialog/confirm-dialog/confirm-dialog.component';
import { AppointmentReasonDialogComponent } from '../dialog/appointment-reason-dialog/appointment-reason-dialog.component';
import {
  RescheduleDialogComponent,
  RescheduleDialogData,
  RescheduleDialogResult,
} from '../dialog/reschedule-dialog/reschedule-dialog.component';

@Component({
  selector: 'app-reschedule-response',
  imports: [CommonModule, FormsModule],
  templateUrl: './reschedule-response.html',
})
export class RescheduleResponse implements OnInit {
  @Input({ required: true }) appointment?: Appointment;
  @Input() mode: 'patient' | 'staff' = 'patient';
  @Output() updated = new EventEmitter<Appointment>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(AppointmentService);
  private readonly dialog = inject(MatDialog);
  private readonly alerts = inject(AlertService);
  busy = false;
  error = '';
  now = Date.now();
  method: 'phone' | 'in_person' = 'phone';
  agreementReason = '';
  get expired(): boolean {
    const appointment = this.appointment;
    return (
      !appointment ||
      Date.parse(
        `${new Date(appointment.date).toISOString().slice(0, 10)}T${appointment.startTime.padStart(5, '0')}:00+08:00`,
      ) <= this.now
    );
  }
  ngOnInit(): void {
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.now = Date.now();
        if (this.expired && !this.busy && this.appointment?.rescheduleProposal)
          this.refresh();
      });
  }
  refresh(): void {
    if (!this.appointment || this.busy) return;
    this.api
      .getOne(this.appointment._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (value) => this.updated.emit(value),
        error: () =>
          (this.error = 'Could not refresh the appointment. Please try again.'),
      });
  }
  accept(): void {
    const appointment = this.appointment,
      proposal = appointment?.rescheduleProposal;
    if (!appointment || !proposal || this.busy || this.expired) return;
    if (this.mode === 'staff' && this.agreementReason.trim().length < 3) {
      this.error = 'Explain how the patient agreed to the new schedule.';
      return;
    }
    this.busy = true;
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '460px',
        maxWidth: '95vw',
        data: {
          message:
            this.mode === 'patient'
              ? 'Accept the proposed date and time? Your appointment will become confirmed.'
              : 'Confirm that the patient agreed to this date and time by phone or in person.',
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        this.busy = false;
        if (confirmed !== true) return;
        this.run(
          this.api.respondToReschedule(appointment._id, {
            proposalId: proposal.id,
            method: this.mode === 'patient' ? 'patient_portal' : this.method,
            ...(this.mode === 'staff'
              ? { reason: this.agreementReason.trim() }
              : {}),
          }),
          'The revised appointment is confirmed.',
        );
      });
  }
  anotherTime(): void {
    const appointment = this.appointment,
      proposal = appointment?.rescheduleProposal;
    if (!appointment || !proposal || this.busy || this.expired) return;
    this.busy = true;
    this.dialog
      .open<
        RescheduleDialogComponent,
        RescheduleDialogData,
        RescheduleDialogResult
      >(RescheduleDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        data: {
          appointmentId: appointment._id,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          clinic: appointment.clinic,
          dentist: appointment.dentist,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.busy = false;
        if (!result) return;
        this.run(
          this.api.rescheduleAppointment(appointment._id, {
            ...result,
            proposalId: proposal.id,
          }),
          this.mode === 'patient'
            ? 'Your requested time is awaiting clinic review.'
            : 'The revised proposal is awaiting the patient response.',
        );
      });
  }
  cancel(): void {
    const appointment = this.appointment,
      proposal = appointment?.rescheduleProposal;
    if (!appointment || !proposal || this.busy) return;
    this.busy = true;
    this.dialog
      .open(AppointmentReasonDialogComponent, {
        width: '460px',
        maxWidth: '95vw',
        data: { action: 'cancel' },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((reason: unknown) => {
        this.busy = false;
        if (typeof reason !== 'string' || !reason.trim()) return;
        this.run(
          this.api.cancelAppointment(
            appointment._id,
            reason.trim(),
            proposal.id,
          ),
          'Appointment cancelled.',
        );
      });
  }
  private run(request: Observable<Appointment>, success: string): void {
    this.busy = true;
    this.error = '';
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.busy = false)),
      )
      .subscribe({
        next: (appointment) => {
          this.alerts.success(success);
          this.updated.emit(appointment);
        },
        error: (error: unknown) => {
          this.error =
            error instanceof HttpErrorResponse &&
            typeof error.error?.message === 'string'
              ? error.error.message
              : 'The appointment could not be updated. Refresh it and try again.';
          this.alerts.error(this.error);
        },
      });
  }
}
