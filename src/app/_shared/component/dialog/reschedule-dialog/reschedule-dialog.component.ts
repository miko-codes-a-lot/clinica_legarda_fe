import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatePicker } from '../../date-picker/date-picker';
import { TimePicker } from '../../time-picker/time-picker';
import { AlertService } from '../../../service/alert.service';
import { User } from '../../../model/user';
import { Clinic } from '../../../model/clinic';
import { bookingSlots, DentistBookingSchedule } from '../../../model/booking-availability';
import { BookingAvailabilityService } from '../../../service/booking-availability-service';

export interface RescheduleDialogResult {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface RescheduleDialogData {
  date: Date | string;
  startTime: string;
  endTime: string;
  appointmentId: string;
  clinic: Clinic;
  dentist: User;
}

@Component({
  selector: 'app-reschedule-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, DatePicker, TimePicker],
  templateUrl: './reschedule-dialog.component.html',
  styleUrls: ['./reschedule-dialog.component.css'],
})
export class RescheduleDialogComponent implements OnInit, OnDestroy {
  private dateChanges?: Subscription;
  private availabilityRequest?: Subscription;
  readonly form: FormGroup<{
    date: FormControl<Date | null>;
    time: FormControl<string>;
    reason: FormControl<string>;
  }>;
  pickerDentist?: DentistBookingSchedule;
  isLoading = false;
  loadError = '';
  readonly minDate = new Date(new Date().setHours(0, 0, 0, 0));
  readonly maxDate = new Date(new Date().setMonth(new Date().getMonth() + 3));
  serviceDuration = 60;

  constructor(
    fb: FormBuilder,
    public dialogRef: MatDialogRef<RescheduleDialogComponent, RescheduleDialogResult>,
    private readonly alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: RescheduleDialogData,
    private readonly availability: BookingAvailabilityService,
  ) {
    this.form = fb.group({
      date: new FormControl<Date | null>(null, Validators.required),
      time: fb.nonNullable.control('', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]),
      reason: fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]),
    });
  }

  ngOnInit() {
    this.dateChanges = this.form.controls.date.valueChanges.subscribe(() => this.form.controls.time.reset());
    const minutes = (time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute;
    };
    const duration = minutes(this.data.endTime) - minutes(this.data.startTime);
    if (duration > 0) this.serviceDuration = duration;
    this.loadAvailability();
  }

  loadAvailability(): void {
    this.availabilityRequest?.unsubscribe();
    this.pickerDentist = undefined;
    this.loadError = '';
    this.isLoading = true;
    this.availabilityRequest = this.availability.load(this.data.dentist, this.data.clinic, this.data.appointmentId).subscribe({
      next: schedule => { this.pickerDentist = schedule; this.isLoading = false; },
      error: () => {
        this.loadError = 'Availability could not be loaded. Please try again.';
        this.isLoading = false;
      },
    });
  }

  onCancel() { this.dialogRef.close(); }

  ngOnDestroy() { this.dateChanges?.unsubscribe(); this.availabilityRequest?.unsubscribe(); }

  onSave() {
    this.form.markAllAsTouched();
    if (this.isLoading || !this.pickerDentist || this.form.invalid) {
      this.alertService.error('Please select a date and time and enter a reason.');
      return;
    }
    const { date, time, reason } = this.form.getRawValue();
    if (!date || Number.isNaN(date.getTime())) return;
    if (!bookingSlots(this.pickerDentist, date, this.serviceDuration).some(slot => slot.value === time && slot.available)) {
      this.alertService.error('Please select an available appointment time.');
      return;
    }
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const currentDate = this.data.date instanceof Date
      ? this.data.date.toISOString().slice(0, 10) : this.data.date.slice(0, 10);
    if (formattedDate === currentDate && time === this.data.startTime) {
      this.alertService.error('You cannot select your current appointment date and time.');
      return;
    }
    const [hour, minute] = time.split(':').map(Number);
    const end = hour * 60 + minute + this.serviceDuration;
    if (end >= 24 * 60) {
      this.alertService.error('The appointment must finish on the selected day.');
      return;
    }
    const endTime = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
    this.dialogRef.close({ date: formattedDate, startTime: time, endTime, reason: reason.trim() });
  }
}
