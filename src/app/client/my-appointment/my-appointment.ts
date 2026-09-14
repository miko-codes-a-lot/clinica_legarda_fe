import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../_shared/service/auth-service';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { ReasonService } from '../../_shared/service/reason-service';
import { Appointment, AppointmentStatus } from '../../_shared/model/appointment';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CancelAppointmentDialogComponent } from '../../_shared/component/dialog/cancel-appointment-dialog/cancel-appointment-dialog.component';
import { RescheduleDialogComponent, RescheduleDialogData, RescheduleDialogResult } from '../../_shared/component/dialog/reschedule-dialog/reschedule-dialog.component';
import { Reason } from '../../_shared/model/reason';
import { AlertService } from '../../_shared/service/alert.service';


@Component({
  selector: 'app-my-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './my-appointment.html',
  styleUrls: ['./my-appointment.css']
})
export class MyAppointment {
  AppointmentStatus = AppointmentStatus;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly authService: AuthService,
    private readonly appointmentService: AppointmentService,
    private dialog: MatDialog,
    private readonly reasonService: ReasonService,
    private readonly alertService: AlertService,

  ) {}

  isLoading = false;
  upcomingAppointmentsData: Appointment[] = [];
  reasons: Reason[] = [];

  ngOnInit(): void {
    this.reasonService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: reasons => this.reasons = reasons,
      error: () => this.alertService.error('Could not load referral reasons.'),
    });
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.authService.currentUser$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        if (user) {
          this.appointmentService.getAll(user._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: Appointment[]) => {
              this.upcomingAppointmentsData = data.sort((a, b) => {
                // Prioritize confirmed over pending
                if (a.status === AppointmentStatus.CONFIRMED && b.status !== AppointmentStatus.CONFIRMED) return -1;
                if (a.status !== AppointmentStatus.CONFIRMED && b.status === AppointmentStatus.CONFIRMED) return 1;
                // Then sort by date ascending
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              });
              this.isLoading = false;
            },
            error: (err) => {
              this.alertService.error('Could not load appointments. Please try again.');
              this.isLoading = false;
            }
          });
        } else {
          this.upcomingAppointmentsData = [];
          this.isLoading = false;
        }
      }
    });
  }

  onCancel(appointment: Appointment) {
    this.dialog.open<CancelAppointmentDialogComponent, undefined, string>(CancelAppointmentDialogComponent, {
      width: '450px',
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(reason => {
      if (!reason?.trim()) return;
      this.isLoading = true;
      this.appointmentService.cancelAppointment(appointment._id, reason.trim())
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.alertService.success('Appointment cancelled successfully.');
            this.loadAppointments();
          },
          error: () => {
            this.isLoading = false;
            this.alertService.error('Failed to cancel appointment. Please try again.');
          },
        });
    });
  }

  onReschedule(appointment: Appointment) {
    const dialogRef = this.dialog.open<RescheduleDialogComponent, RescheduleDialogData, RescheduleDialogResult>(RescheduleDialogComponent, {
      width: '450px',
      data: {
        date: appointment.date, startTime: appointment.startTime, endTime: appointment.endTime,
        operatingHours: appointment.dentist?.operatingHours?.length
          ? appointment.dentist.operatingHours : appointment.clinic?.operatingHours || [],
      },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (!result) return;
      this.isLoading = true;
      this.appointmentService.rescheduleAppointment(appointment._id, {
        ...result, patient: appointment.patient._id, dentist: appointment.dentist._id,
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.alertService.success('Appointment rescheduled successfully.');
          this.loadAppointments();
        },
        error: () => {
          this.isLoading = false;
          this.alertService.error('Could not reschedule the appointment. Please check the selected time and try again.');
        },
      });
    });
  }

  isAppointmentPast(appointment: Appointment): boolean {
    if (!appointment?.date || !appointment?.endTime) return false;

    const appointmentDate = new Date(appointment.date);

    const [hours, minutes] = appointment.endTime.split(':').map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);

    return appointmentDate.getTime() < new Date().getTime();
  }

  // ✅ Computed lists
  get confirmedAppointments(): Appointment[] {
    return this.upcomingAppointmentsData.filter(a => a.status === AppointmentStatus.CONFIRMED);
  }
  get pendingAppointments(): Appointment[] {
    return this.upcomingAppointmentsData.filter(a => a.status === AppointmentStatus.PENDING);
  }
  get rejectedAppointments(): Appointment[] {
    return this.upcomingAppointmentsData.filter(a => a.status === AppointmentStatus.REJECTED);
  }
  get cancelledAppointments(): Appointment[] {
    return this.upcomingAppointmentsData.filter(a => a.status === AppointmentStatus.CANCELLED);
  }

  // ✅ Booleans
  get hasConfirmedAppointments(): boolean { return this.confirmedAppointments.length > 0; }
  get hasPendingAppointments(): boolean { return this.pendingAppointments.length > 0; }
  get hasRejectedAppointments(): boolean { return this.rejectedAppointments.length > 0; }
  get hasCancelledAppointments(): boolean { return this.cancelledAppointments.length > 0; }

  getReasonLabel(code?: string): string {
    if (!code) return 'N/A';

    const found = this.reasons.find(r => r.code === code);
    return found?.label ?? code;
  }

}
