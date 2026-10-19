import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BookingSlot, bookingSlots, DentistBookingSchedule, minutesTime } from '../../model/booking-availability';
@Component({ selector: 'app-booking-calendar', imports: [CommonModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './booking-calendar.html', styleUrl: './booking-calendar.css' })
export class BookingCalendar implements OnChanges {
  @Input({ required: true }) schedule!: DentistBookingSchedule;
  @Input() date: Date | null = null; @Input() time = ''; @Input() duration = 30;
  @Input() minDate: Date | null = null; @Input() maxDate: Date | null = null; @Input() disabled = false;
  @Output() dateChange = new EventEmitter<Date>(); @Output() timeChange = new EventEmitter<string>();
  slots: BookingSlot[] = []; dateClass = (_date: Date) => '';
  ngOnChanges() {
    this.slots = this.date && this.schedule ? bookingSlots(this.schedule, this.date, this.duration) : [];
    this.dateClass = date => this.schedule && bookingSlots(this.schedule, date, this.duration).some(slot => slot.available) ? 'booking-day-available' : 'booking-day-unavailable';
  }
  selectDate(date: Date | null) { if (!date || this.disabled) return; this.timeChange.emit(''); this.dateChange.emit(date); }
  selectTime(slot: BookingSlot) { if (slot.available && !this.disabled) this.timeChange.emit(slot.value); }
  get availableCount() { return this.slots.filter(slot => slot.available).length; }
  get selectedEnd() {
    if (!this.time) return '';
    const [hour, minute] = this.time.split(':').map(Number);
    return this.timeLabel(minutesTime(hour * 60 + minute + this.duration));
  }
  timeLabel(value: string) { const [hour, minute] = value.split(':').map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`; }
}
