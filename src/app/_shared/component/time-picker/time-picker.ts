// time-picker.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl, ValidationErrors, Validator, NG_VALIDATORS } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { bookingSlots, DentistBookingSchedule } from '../../model/booking-availability';
import { MatSelectChange } from '@angular/material/select';

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
    <mat-form-field [appearance]="appearance" style="display: block;">
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
    mat-form-field {
      --mat-form-field-filled-focus-active-indicator-color: #1976d2;
      --mat-form-field-filled-focus-label-text-color: #1976d2;
      --mat-form-field-outlined-focus-outline-color: #1976d2;
      --mat-form-field-outlined-focus-label-text-color: #1976d2;
      --mat-form-field-focus-select-arrow-color: #1976d2;
    }

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
export class TimePicker implements ControlValueAccessor, Validator, OnChanges {
  @Input() label = 'Select Time';
  @Input() placeholder = 'Choose a time slot';
  @Input() hint = '';
  @Input() appearance: 'fill' | 'outline' = 'fill';
  @Input() required = false;
  @Input() errorMessage = 'Please select an available time';
  @Input() dentist?: DentistBookingSchedule;
  @Input() selectedDate: Date | null = null;
  @Input() serviceDuration = 60;
  @Input() timeSlotInterval = 30;

  value: string | null = null;
  disabled = false;
  showError = false;
  timeSlots: TimeSlot[] = [];
  private onChange = (_value: string | null) => {};
  private onTouched = () => {};
  private validatorChanged = () => {};

  ngOnChanges(): void {
    this.timeSlots = this.selectedDate && this.dentist
      ? bookingSlots(this.dentist, this.selectedDate, this.serviceDuration, this.timeSlotInterval)
        .map(slot => ({ ...slot, display: this.formatTimeDisplay(slot.value) }))
      : [];
    this.validatorChanged();
  }

  writeValue(value: string | null): void { this.value = value; }
  registerOnChange(fn: (value: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  registerOnValidatorChange(fn: () => void): void { this.validatorChanged = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return this.required ? { required: true } : null;
    return this.timeSlots.some(slot => slot.value === control.value && slot.available)
      ? null : { unavailableTime: true };
  }

  onTimeChange(event: Pick<MatSelectChange, 'value'>): void {
    this.value = typeof event.value === 'string' ? event.value : null;
    this.onChange(this.value);
    this.onTouched();
  }

  private formatTimeDisplay(time: string): string {
    const [hour, minute] = time.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }
}
