import { Appointment, AppointmentStatus } from './appointment';

export function canCancelAppointment(appointment: Appointment | undefined, actorId: string | undefined): boolean {
  if (!appointment || !actorId || ![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appointment.status)) {
    return false;
  }
  const day = new Date(appointment.date);
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(appointment.startTime);
  if (!Number.isFinite(day.getTime()) || !match || Number(match[1]) > 23) return false;
  day.setUTCHours(Number(match[1]) - 8, Number(match[2]), 0, 0);
  if (Date.now() >= day.getTime()) return false;
  const creator = appointment.createdBy ?? appointment.history.find(entry => entry.action === 'Appointment created.')?.actorId;
  return !!creator && creator.toLowerCase() === actorId.toLowerCase();
}
