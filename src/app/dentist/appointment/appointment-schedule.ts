import { Appointment, AppointmentStatus } from '../../_shared/model/appointment';
import { appointmentHasEnded } from '../../_shared/model/appointment-history';

export function requiresAppointmentOutcome(appointment: Appointment, now = new Date()): boolean {
  return appointment.status === AppointmentStatus.CONFIRMED && appointmentHasEnded(appointment, now);
}

// Appointment dates are clinic calendar dates serialized at UTC midnight.
export function appointmentDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function clinicClock(now = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value ?? '';
  return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
}

export function formatAppointmentDate(value: Date | string): string {
  const key = appointmentDateKey(value);
  return key ? new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(`${key}T00:00:00Z`)) : 'Date unavailable';
}

export function isActiveAppointment(appointment: Appointment): boolean {
  return appointment.status === AppointmentStatus.PENDING || appointment.status === AppointmentStatus.CONFIRMED;
}

export function compareAppointmentSchedule(a: Appointment, b: Appointment): number {
  return `${appointmentDateKey(a.date)} ${a.startTime}`.localeCompare(`${appointmentDateKey(b.date)} ${b.startTime}`);
}
