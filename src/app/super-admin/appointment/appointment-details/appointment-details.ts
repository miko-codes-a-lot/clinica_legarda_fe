import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../../../_shared/service/auth-service';
import { canCancelAppointment } from '../../../_shared/model/appointment-permissions';
import { AppointmentReasonDialogComponent, AppointmentReasonDialogData } from '../../../_shared/component/dialog/appointment-reason-dialog/appointment-reason-dialog.component';
import { Component, DestroyRef, inject } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { appointmentActorLabel, appointmentStatusLabel } from '../../../_shared/model/appointment-history';
import { formatAppointmentDate } from '../../../dentist/appointment/appointment-schedule';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { NotesDialogComponent } from '../../../_shared/component/dialog/notes-dialog/notes-dialog.component';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
selector: 'app-appointment-details',
  imports: [ListComponent, MatListModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './appointment-details.html',
  styleUrl: './appointment-details.css'
})
export class AppointmentDetails {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  isDialogOpen = false;
  readonly actorLabel = appointmentActorLabel;
  isLoading = false
  id!: string
  appointment?: Appointment
  displayAppointment: Record<string, string> = {};

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.appointmentService.getOne(this.id).subscribe({
      next: (a) => {
        const { status, date, startTime, endTime, clinic: clinicData, dentist: dentistData, patient: patientData } = a
        this.displayAppointment = {
          status: appointmentStatusLabel(status),
          date: formatAppointmentDate(date),
          time: startTime + ' - ' + endTime,
          clinic: clinicData.name,
          clinicAddress: clinicData.address,
          dentist: dentistData.firstName + ' ' + dentistData.lastName,
          patient: patientData.firstName + ' ' + patientData.lastName,
        }
        this.appointment = a
      },
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate(['/super-admin/appointment/update', this.id])
  }

  isClinicNotesDisabled() {
    return this.appointment && ['rejected', 'cancelled'].includes(this.appointment.status);
  }

  isClinicEditDisabled() {
    return this.isBusy || !this.appointment || this.appointment.status !== 'pending';
  }

  openNotesDialog() {
    if (!this.appointment || this.isBusy) return;

    const dialogRef = this.dialog.open(NotesDialogComponent, {
      data: { clinicNotes: this.appointment.notes.clinicNotes }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.isLoading = true;
        if(this.appointment?._id) {
          this.appointmentService.updateDentistNotes(this.appointment._id, result)
            .subscribe({
              next: (updatedAppointment) => {
                this.appointment = updatedAppointment;
                this.alertService.error('Clinic notes updated successfully!');
                this.isLoading = false;
              },
              error: (err) => {
                console.error(err);
                this.alertService.error('Failed to update clinic notes');
                this.isLoading = false;
              }
          });
        }
      }
    });
  }

  approveAppointment() {
    if (!this.appointment?._id || this.isActionDisabled()) return;

    this.isLoading = true;

    this.appointmentService.approveAppointment(this.appointment._id).subscribe({
      next: (updatedAppointment: Appointment) => {
        // Update local object
        this.appointment = updatedAppointment;
        this.displayAppointment['status'] = appointmentStatusLabel(updatedAppointment.status);

        this.isLoading = false;
        this.alertService.error('Appointment approved successfully!');
        location.reload();
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        this.alertService.error(err.error.message);
      }
    });
  }

  isActionDisabled() {
    return this.isBusy || !this.appointment || this.appointment.status !== 'pending';
  }

  declineAppointment(): void {
    if (!this.appointment || this.isActionDisabled()) return;
    this.requestReason('reject');
  }

  get isBusy(): boolean {
    return this.isLoading || this.isDialogOpen;
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
      if (!reason?.trim()) return;
      this.isLoading = true;
      const request = action === 'cancel'
        ? this.appointmentService.cancelAppointment(appointmentId, reason.trim())
        : this.appointmentService.rejectAppointment(appointmentId, reason.trim());
      request.pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading = false),
      ).subscribe({
        next: appointment => {
          this.appointment = appointment;
          this.displayAppointment['status'] = appointmentStatusLabel(appointment.status);
          this.alertService.success(action === 'cancel' ? 'Appointment cancelled successfully!' : 'Appointment rejected successfully!');
        },
        error: () => this.alertService.error('The appointment could not be updated. Please try again.'),
      });
    });
  }
}
