import { Appointment, AppointmentStatus } from './appointment';
import { assignedClinicIds, ClinicMembership } from './user';

type CancellationActor = ClinicMembership & { _id: string; role: string };

export function canCancelAppointment(appointment: Appointment | undefined, actor: CancellationActor | null | undefined): boolean {
  if (!appointment || !actor?._id || ![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appointment.status)) {
    return false;
  }
  const day = new Date(appointment.date);
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(appointment.startTime);
  if (!Number.isFinite(day.getTime()) || !match || Number(match[1]) > 23) return false;
  day.setUTCHours(Number(match[1]) - 8, Number(match[2]), 0, 0);
  if (Date.now() >= day.getTime()) return false;
  const creator = appointment.createdBy ?? appointment.history.find(entry => entry.action === 'Appointment created.')?.actorId;
  if (creator && creator.toLowerCase() === actor._id.toLowerCase()) return true;
  if (appointment.status !== AppointmentStatus.CONFIRMED) return false;
  if (actor.role === 'super-admin') return true;
  if (actor.role === 'dentist') return appointment.dentist._id?.toLowerCase() === actor._id.toLowerCase();
  const clinicId = appointment.clinic._id?.toLowerCase();
  return actor.role === 'admin' && !!clinicId && assignedClinicIds(actor).some(id => id.toLowerCase() === clinicId);
}
