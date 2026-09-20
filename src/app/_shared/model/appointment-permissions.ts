import { Appointment, AppointmentStatus } from './appointment';

export function canCancelAppointment(appointment: Appointment | undefined, actorId: string | undefined): boolean {
  if (!appointment || !actorId || ![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appointment.status)) {
    return false;
  }
  const creator = appointment.createdBy ?? appointment.history.find(entry => entry.action === 'Appointment created.')?.actorId;
  return !!creator && creator.toLowerCase() === actorId.toLowerCase();
}
