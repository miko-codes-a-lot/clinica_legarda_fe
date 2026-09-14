import { Component, forwardRef, Input, OnChanges } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validator } from '@angular/forms';
import { FloatLabelType, MatFormFieldModule } from '@angular/material/form-field';
import { DateFilterFn, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { bookingSlots, DentistBookingSchedule } from '../../model/booking-availability';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
  selector: 'app-date-picker',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    MatNativeDateModule,
    CommonModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DatePicker),
      multi: true,
    }
  ],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.css'
})
export class DatePicker implements ControlValueAccessor, Validator, OnChanges {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() appearance: 'fill' | 'outline' = 'fill';
  @Input() floatLabel: FloatLabelType = 'auto';
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() touchUi = false;
  @Input() startView: 'month' | 'year' | 'multi-year' = 'month';
  @Input() required = false;
  @Input() errorMessage = 'Please select an available date';
  @Input() serviceDuration = 60;
  @Input() timeSlotInterval = 30;
  @Input() dentist: DentistBookingSchedule = { operatingHours: [], appointments: [] };

  value: Date | null = null;
  disabled = false;
  showError = false;
  private onChange = (_value: Date | null) => {};
  private onTouched = () => {};
  private validatorChanged = () => {};

  ngOnChanges(): void { this.validatorChanged(); }
  writeValue(value: Date | null): void { this.value = value; }
  registerOnChange(fn: (value: Date | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  registerOnValidatorChange(fn: () => void): void { this.validatorChanged = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return this.required ? { required: true } : null;
    if (!this.isDate(control.value)) return { matDatepickerParse: true };
    if (this.minDate && this.dateOnlyTime(control.value) < this.dateOnlyTime(this.minDate)) {
      return { matDatepickerMin: { min: this.minDate, actual: control.value } };
    }
    if (this.maxDate && this.dateOnlyTime(control.value) > this.dateOnlyTime(this.maxDate)) {
      return { matDatepickerMax: { max: this.maxDate, actual: control.value } };
    }
    return this.dateFilter(control.value) ? null : { matDatepickerFilter: true };
  }

  isDate(value: unknown): value is Date {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }

  dateFilter: DateFilterFn<Date | null> = date => !!date && this.isDate(date) &&
    bookingSlots(this.dentist, date, this.serviceDuration, this.timeSlotInterval).some(slot => slot.available);

  onDateChange(event: Pick<MatDatepickerInputEvent<Date>, 'value'>): void {
    this.value = event.value;
    this.onChange(this.value);
    this.onTouched();
  }

  private dateOnlyTime(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }
}
