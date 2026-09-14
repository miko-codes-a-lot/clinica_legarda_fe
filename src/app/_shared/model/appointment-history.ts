import { Appointment, AppointmentHistory, AppointmentStatus } from './appointment';
import { storedDateKey, timeMinutes } from './booking-availability';

export function appointmentHasEnded(
  appointment: { date: Date | string; endTime: string },
  now = new Date(),
): boolean {
  const day = storedDateKey(appointment.date);
  const minutes = timeMinutes(appointment.endTime);
  if (!day || !Number.isFinite(minutes)) return false;
  // Stored dates are calendar days; the appointment's time is in Manila (UTC+08).
  const end = Date.parse(`${day}T00:00:00Z`) + (minutes - 8 * 60) * 60_000;
  return now.getTime() > end;
}

export function isPreviousTreatment(appointment: Appointment, now = new Date()): boolean {
  return appointment.status === AppointmentStatus.COMPLETED ||
    (appointment.status === AppointmentStatus.CONFIRMED && appointmentHasEnded(appointment, now));
}

export function isAppointmentHistory(appointment: Appointment, now = new Date()): boolean {
  return appointment.status === AppointmentStatus.NO_SHOW || isPreviousTreatment(appointment, now);
}

const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed',
  no_show: 'No show', rejected: 'Rejected', cancelled: 'Cancelled',
};

export function appointmentStatusLabel(status: string): string {
  return statusLabels[status as AppointmentStatus] ?? status;
}

export function appointmentActorLabel(entry: AppointmentHistory): string {
  const roles: Record<string, string> = {
    'super-admin': 'Super admin', admin: 'Admin', dentist: 'Dentist', user: 'Patient',
  };
  const actor = entry.actorName || entry.actorId;
  const role = entry.actorRole ? roles[entry.actorRole] || entry.actorRole : '';
  return actor && role ? `${actor} (${role})` : actor || role;
}
