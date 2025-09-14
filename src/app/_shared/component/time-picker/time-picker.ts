// time-picker.component.ts
import { Component, Input, Output, EventEmitter, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl, ValidationErrors, Validator, NG_VALIDATORS } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { AppointmentStatus } from '../../model/appointment';
import { User } from '../../model/user';
import { TimeUtil } from '../../../utils/time-util';

interface TimeSlot {
  value: string;
  display: string;
  available: boolean;
}

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    CommonModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TimePicker),
      multi: true,
    }
  ],
  template: `
    <mat-form-field [appearance]="appearance">
      <mat-label *ngIf="label">{{ label }}</mat-label>
      <mat-select
        [value]="value"
        [disabled]="disabled"
        [placeholder]="placeholder"
        (selectionChange)="onTimeChange($event)"
      >
        <mat-option 
          *ngFor="let slot of timeSlots" 
          [value]="slot.value"
          [disabled]="!slot.available"
          [class.unavailable-slot]="!slot.available"
        >
          {{ slot.display }}
          <span *ngIf="!slot.available" class="unavailable-text"> (Unavailable)</span>
        </mat-option>
      </mat-select>
      <mat-hint *ngIf="hint">{{ hint }}</mat-hint>
      <mat-error *ngIf="showError">
        {{ errorMessage }}
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .unavailable-slot {
      color: rgba(0, 0, 0, 0.38) !important;
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .unavailable-text {
      font-size: 0.8em;
      color: rgba(0, 0, 0, 0.54);
      font-style: italic;
    }

    ::ng-deep .mat-mdc-option.mdc-list-item--disabled {
      opacity: 0.5;
    }
  `]
})
export class TimePicker implements ControlValueAccessor, Validator, OnInit {
  @Input() label: string = 'Select Time';
  @Input() placeholder: string = 'Choose a time slot';
  @Input() hint: string = '';
  @Input() appearance: 'fill' | 'outline' = 'fill';
  @Input() required: boolean = false;
  @Input() errorMessage: string = 'Please select a valid time';
  @Input() dentist!: User;
  @Input() selectedDate: Date | null = null;
  @Input() serviceDuration: number = 60; // Duration in minutes
  @Input() timeSlotInterval: number = 30; // Time slot intervals in minutes

  value: string | null = null;
  disabled: boolean = false;
  showError: boolean = false;
  timeSlots: TimeSlot[] = [];

  private onChange = (value: string | null) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    this.dentist.appointments = [
      {
        _id: '',
        clinic: {} as any,
        patient: {} as User,
        dentist: {} as User,
        services: [],
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        status: AppointmentStatus.CONFIRMED,
        notes: {
          patientNotes: '',
          clinicNotes: '',
        },
        history: []
      }
    ]
    this.generateTimeSlots();
  }

  ngOnChanges(): void {
    // Regenerate time slots when selectedDate or dentist changes
    if (this.selectedDate && this.dentist) {
      this.generateTimeSlots();
    }
  }

  writeValue(value: string | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required && !control.value) {
      return { required: true };
    }
    return null;
  }

  onTimeChange(event: any): void {
    this.value = event.value;
    this.onChange(this.value);
    this.onTouched();
  }

  private generateTimeSlots(): void {
    if (!this.selectedDate || !this.dentist) {
      this.timeSlots = [];
      return;
    }

    const dayName = this.getDayNameFromDate(this.selectedDate);
    const daySchedule = this.dentist.operatingHours.find(oh => oh.day === dayName);

    if (!daySchedule) {
      this.timeSlots = [];
      return;
    }

    const startMinutes = TimeUtil.timeToMinutes(daySchedule.startTime);
    const endMinutes = TimeUtil.timeToMinutes(daySchedule.endTime);
    const slots: TimeSlot[] = [];

    // Generate time slots based on interval
    for (let minutes = startMinutes; minutes < endMinutes; minutes += this.timeSlotInterval) {
      const timeString = this.minutesToTime(minutes);
      const endTimeMinutes = minutes + this.serviceDuration;
      
      // Check if the slot (including service duration) fits within operating hours
      if (endTimeMinutes <= endMinutes) {
        const isAvailable = this.isTimeSlotAvailable(timeString, this.selectedDate);
        slots.push({
          value: timeString,
          display: this.formatTimeDisplay(timeString),
          available: isAvailable
        });
      }
    }

    this.timeSlots = slots;
  }

  private isTimeSlotAvailable(startTime: string, date: Date): boolean {
    // Get the current time
    const dateNow = new Date();
    const hours = String(dateNow.getHours()).padStart(2, '0');
    const minutes = String(dateNow.getMinutes()).padStart(2, '0');

    const currentTime = `${hours}:${minutes}`;
 
    const startMinutes = TimeUtil.timeToMinutes(startTime);
    const endMinutes = startMinutes + this.serviceDuration;

    // Get all appointments for the selected date
    const dayAppointments = this.dentist.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return this.isSameDate(appointmentDate, date) &&
        (appointment.status !== AppointmentStatus.CANCELLED &&
         appointment.status !== AppointmentStatus.REJECTED);
    });

    // Check if the time slot conflicts with any existing appointment
    for (const appointment of dayAppointments) {
      const appointmentStart = TimeUtil.timeToMinutes(appointment.startTime);
      const appointmentEnd = TimeUtil.timeToMinutes(appointment.endTime);

      // Check for overlap
      if (
        (startMinutes >= appointmentStart && startMinutes < appointmentEnd) ||
        (endMinutes > appointmentStart && endMinutes <= appointmentEnd) ||
        (startMinutes <= appointmentStart && endMinutes >= appointmentEnd) ||
        (currentTime > startTime)
      ) {
        return false; // Time slot is not available
      }
    }

    return true; // Time slot is available
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private formatTimeDisplay(timeString: string): string {
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  private getDayNameFromDate(date: Date): string {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[date.getDay()];
  }
}