import { AppointmentStatus } from './appointment';
import { Clinic } from './clinic';
import { OperatingHour } from './operating-hour';
import { assignedClinicIds, User } from './user';

/** The availability endpoint intentionally excludes patient and clinical details. */
export interface AppointmentAvailability {
  _id: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
}

export interface DentistBookingSchedule {
  operatingHours: readonly OperatingHour[];
  appointments: readonly AppointmentAvailability[];
  appointmentBufferMinutes?: number;
  maxWorkingMinutesPerDay?: number;
}

export interface BookingSlot { value: string; available: boolean; }

export function isBookableDentist(dentist: User, clinicId: string): boolean {
  return dentist.role === 'dentist' && dentist.status === 'confirmed' && assignedClinicIds(dentist).includes(clinicId);
}

export function timeMinutes(time: string): number {
  if (!/^\d{1,2}:\d{2}$/.test(time)) return NaN;
  const [hour, minute] = time.split(':').map(Number);
  return hour < 24 && minute < 60 ? hour * 60 + minute : NaN;
}

export function minutesTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** A picker Date represents its local calendar fields, not an absolute instant. */
export function pickerDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function storedDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function pickerDateFromStored(value: Date | string): Date {
  const [year, month, day] = storedDateKey(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function createBookingSchedule(
  dentist: DentistBookingSchedule,
  clinic: Pick<Clinic, 'operatingHours'>,
  appointments: readonly AppointmentAvailability[],
  excludeAppointmentId?: string,
): DentistBookingSchedule {
  const operatingHours = dentist.operatingHours.flatMap(hours => {
    const clinicHours = clinic.operatingHours?.find(candidate => candidate.day === hours.day);
    if (!clinicHours) return [];
    const start = Math.max(timeMinutes(hours.startTime), timeMinutes(clinicHours.startTime));
    const end = Math.min(timeMinutes(hours.endTime), timeMinutes(clinicHours.endTime));
    return start < end ? [{ day: hours.day, startTime: minutesTime(start), endTime: minutesTime(end) }] : [];
  });
  return {
    operatingHours,
    appointments: appointments.filter(appointment => appointment._id !== excludeAppointmentId),
    appointmentBufferMinutes: dentist.appointmentBufferMinutes ?? 15,
    maxWorkingMinutesPerDay: dentist.maxWorkingMinutesPerDay ?? 480,
  };
}

const clinicFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function bookingSlots(
  schedule: DentistBookingSchedule,
  date: Date,
  duration: number,
  interval = 30,
  now = new Date(),
): BookingSlot[] {
  if (Number.isNaN(date.getTime()) || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(interval) || interval <= 0) return [];
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  const hours = schedule.operatingHours.find(hours => hours.day === dayName);
  if (!hours) return [];
  const parts = clinicFormatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '';
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const currentMinutes = Number(part('hour')) * 60 + Number(part('minute')) + Number(part('second')) / 60;
  const dateKey = pickerDateKey(date);
  const occupied = schedule.appointments.filter(appointment =>
    storedDateKey(appointment.date) === dateKey &&
    (appointment.status === AppointmentStatus.PENDING || appointment.status === AppointmentStatus.CONFIRMED),
  );
  const buffer = Math.max(0, schedule.appointmentBufferMinutes ?? 15);
  const usedMinutes = occupied.reduce((total, appointment) =>
    total + timeMinutes(appointment.endTime) - timeMinutes(appointment.startTime) + buffer, 0);
  const withinCapacity = usedMinutes + duration + buffer <= (schedule.maxWorkingMinutesPerDay ?? 480);
  const slots: BookingSlot[] = [];
  for (let start = timeMinutes(hours.startTime); start + duration <= timeMinutes(hours.endTime); start += interval) {
    const overlaps = occupied.some(appointment =>
      start < timeMinutes(appointment.endTime) + buffer && start + duration + buffer > timeMinutes(appointment.startTime),
    );
    slots.push({ value: minutesTime(start), available: withinCapacity && !overlaps &&
      (dateKey > today || (dateKey === today && start >= currentMinutes)) });
  }
  return slots;
}
