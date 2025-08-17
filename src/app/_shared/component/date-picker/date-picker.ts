import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validator } from '@angular/forms';
import { FloatLabelType, MatFormFieldModule } from '@angular/material/form-field';
import { DateFilterFn, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { User } from '../../model/user';
import { AppointmentStatus } from '../../model/appointment';
import { TimeUtil } from '../../../utils/time-util';

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
export class DatePicker implements ControlValueAccessor, Validator, OnDestroy, OnInit {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() hint: string = '';
  @Input() appearance: 'fill' | 'outline' = 'fill';
  @Input() floatLabel: FloatLabelType = 'auto';
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() touchUi: boolean = false;
  @Input() startView: 'month' | 'year' | 'multi-year' = 'month';
  // @Input() dateFilter: DateFilterFn<Date | null> = () => true;
  @Input() required: boolean = false;
  @Input() errorMessage: string = 'Please select a valid date';
  @Input() dentist!: User

  value: Date | null = null;
  disabled: boolean = false;
  showError: boolean = false;

  private destroy$ = new Subject<void>();
  private onChange = (value: Date | null) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    // // { day: 'friday', startTime: '09:00', endTime: '18:00' },
    // // mock a fully booked day for the dentist
    // this.dentist.appointments = [
    //   {
    //     _id: '',
    //     clinic: {} as any,
    //     patient: {} as User,
    //     dentist: {} as User,
    //     services: [],
    //     date: new Date(),
    //     startTime: '09:00',
    //     endTime: '18:00',
    //     status: AppointmentStatus.CONFIRMED,
    //     notes: {
    //       patientNotes: '',
    //       clinicNotes: '',
    //     },
    //     history: []
    //   }
    // ]
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  writeValue(value: Date | null): void {
    this.value = value
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required && !control.value) {
      return { required: true };
    }

    if (control.value && this.minDate && control.value < this.minDate) {
      return { matDatepickerMin: { min: this.minDate, actual: control.value } };
    }

    if (control.value && this.maxDate && control.value > this.maxDate) {
      return { matDatepickerMax: { max: this.maxDate, actual: control.value } };
    }

    if (control.value && this.dateFilter && !this.dateFilter(control.value)) {
      return { matDatepickerFilter: true };
    }

    return null;
  }

  isDate(value: any): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
  }

  dayNameToNumber: Record<string, number>= {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.isDate(date)) return false

    const day = date.getDay()

    // // mock available days of the dentist
    // const operatingHours = this.dentist.operatingHours.filter((_, i) => i < 5)
    const operatingHours = this.dentist.operatingHours
    const days = operatingHours.map(o => this.dayNameToNumber[o.day])

    // disable if dentist does not operate on this day
    if (!days.includes(day)) return false

    // disable if dentist is fully booked for the day
    if (this.isFullyBooked(date)) return false

    return true
  }

  private isFullyBooked(date: Date): boolean {
    const dayName = this.getDayNameFromDate(date)
    const daySchedule = this.dentist.operatingHours.find(oh => oh.day === dayName)

    if (!daySchedule) return true // if no schedule, consider it fully booked

    // get all the appointment for this specific date
    const appointments = this.dentist.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date)
      return this.isSameDate(appointmentDate, date) &&
        (appointment.status !== AppointmentStatus.CANCELLED &&
          appointment.status !== AppointmentStatus.REJECTED)
    })

    const totalBookedMinutes = appointments.reduce((total, appointment) => {
      const startMinutes = TimeUtil.timeToMinutes(appointment.startTime)
      const endMinutes = TimeUtil.timeToMinutes(appointment.endTime)
      return total + (endMinutes - startMinutes)
    }, 0)

    const dayStartMinutes = TimeUtil.timeToMinutes(daySchedule.startTime);
    const dayEndMinutes = TimeUtil.timeToMinutes(daySchedule.endTime);
    const totalAvailableMinutes = dayEndMinutes - dayStartMinutes;
    
    // considered fully book if 90% or more of the time is occupied
    const occupancyThreshold = 0.9
    return totalBookedMinutes > (totalAvailableMinutes * occupancyThreshold)
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

  onDateChange(event: any): void {
    this.value = event.value
    this.onChange(this.value)
    this.onTouched()
  }
}
