import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DatePicker } from '../../date-picker/date-picker';
import { TimePicker } from '../../time-picker/time-picker';

interface OperatingHour {
  day: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-reschedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    DatePicker,
    TimePicker
  ],
  templateUrl: './reschedule-dialog.component.html',
  styleUrls: ['./reschedule-dialog.component.css'],
})
export class RescheduleDialogComponent implements OnInit {
  form!: FormGroup;
  availableDays: string[] = [];
  minDate: string = '';
  fakeDentist: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RescheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      date: string;
      startTime: string;
      endTime: string;
      operatingHours: OperatingHour[];
    }
  ) {}

  ngOnInit() {
    this.availableDays = (this.data.operatingHours || []).map(d => d.day.toLowerCase());
    this.minDate = new Date().toISOString().split('T')[0];

    // const appointmentDate = new Date(this.data.date);

    // Prefill time as string "HH:MM - HH:MM" for TimePicker
    // const timeValue = this.data.startTime && this.data.endTime
    //   ? `${this.data.startTime} - ${this.data.endTime}`
    //   : '';
    this.form = this.fb.group({
      date: [], // no selected date
      time: [] // ✅ prefill the picker correctly
    });

    // Fake dentist object for the picker
    this.fakeDentist = {
      firstName: '',
      middleName: '',
      lastName: '',
      emailAddress: '',
      mobileNumber: '',
      address: '',
      operatingHours: this.data.operatingHours,
      appointments: [],
      role: 'dentist',
    };
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (!this.form.valid) {
      alert('Please select a date and time.');
    };

    const { date, time } = this.form.value;

    const currentAppointmentDate = new Date(this.data.date);
    const selectedDate = new Date(date);

    // Format the time from the picker
    const selectedTime = time; 
    const currentTime = this.data.startTime; 

    // Check if both date and time are the same
    if (
      selectedDate.toDateString() === currentAppointmentDate.toDateString() &&
      selectedTime.startsWith(currentTime)
    ) {
      alert('You cannot select your current appointment date and time.');
      return;
    }

    // If time picker returns only a start time (e.g., "09:30")
    const [hour, minute] = time.split(':').map(Number);
    const startTimeRaw = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // Calculate end time based on service duration (e.g., 60 min)
    const endDate = new Date();
    endDate.setHours(hour, minute + 60); // use your service duration
    const endHour = endDate.getHours().toString().padStart(2, '0');
    const endMinute = endDate.getMinutes().toString().padStart(2, '0');
    const endTimeRaw = `${endHour}:${endMinute}`;

    const formatToHHMM = (val: any) => {
      if (!val) return '';
      if (val instanceof Date) return val.toTimeString().slice(0, 5);
      if (typeof val === 'string') {
        const parts = val.split(':');
        if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      return '';
    };

    const startTime = formatToHHMM(startTimeRaw);
    const endTime = formatToHHMM(endTimeRaw);

    if (!startTime || !endTime) {
      alert('Invalid time format. Please select a valid time slot.');
      return;
    }

    const formattedDate = date instanceof Date
      ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
      : date;


    this.dialogRef.close({ date: formattedDate, startTime, endTime });
  }

}
