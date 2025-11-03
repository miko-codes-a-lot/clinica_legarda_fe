import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../_shared/service/auth-service';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { Appointment, AppointmentStatus } from '../../_shared/model/appointment';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RescheduleDialogComponent } from '../../_shared/component/dialog/reschedule-dialog/reschedule-dialog.component';

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

  constructor(
    private readonly authService: AuthService,
    private readonly appointmentService: AppointmentService,
    private dialog: MatDialog
  ) {}

  isLoading = false;
  upcomingAppointmentsData: Appointment[] = [];

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.appointmentService.getAll(user._id).subscribe({
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
              console.error(err);
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  onCancel(appointment: Appointment) {
    this.isLoading = true;
    this.appointmentService.cancelAppointment(appointment._id).subscribe({
      next: () => {
        this.isLoading = false;
        alert('Appointment cancelled successfully!');
        this.loadAppointments();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        alert('Failed to cancel appointment.');
      }
    });
  }

  onReschedule(appointment: Appointment) {
    const dialogRef = this.dialog.open(RescheduleDialogComponent, {
      width: '450px',
      data: {
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        operatingHours:
          appointment.dentist?.operatingHours?.length
            ? appointment.dentist.operatingHours
            : appointment.clinic?.operatingHours || []
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      const formatTime = (time: any) => {
        if (!time) return '';
        if (typeof time === 'string') return time; // already string
        if (time instanceof Date) return time.toTimeString().slice(0, 5); // "HH:MM"
        return '';
      };

      const payload = {
        date: result.date instanceof Date ? result.date.toISOString().split('T')[0] : result.date,
        startTime: formatTime(result.startTime),
        endTime: formatTime(result.endTime),
        patient: appointment.patient._id,
        dentist: appointment.dentist._id
      };

      this.isLoading = true;

      this.appointmentService.rescheduleAppointment(appointment._id, payload).subscribe({
        next: () => {
          this.isLoading = false;
          alert('✅ Appointment rescheduled successfully!');
          this.loadAppointments();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          alert(err.error.message);
        }
      });
    });

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
}
