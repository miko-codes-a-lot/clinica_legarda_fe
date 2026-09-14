import { Appointment, AppointmentStatus } from './appointment';
import { Clinic } from './clinic';
import { assignedClinicIds, assignedClinics, ClinicMembership } from './user';

export interface AppointmentClinicOption {
  id: string;
  name: string;
}

export function filterAppointments(
  appointments: readonly Appointment[],
  clinicId = 'all',
  status: 'all' | AppointmentStatus = 'all',
): Appointment[] {
  return appointments.filter(appointment =>
    (clinicId === 'all' || appointment.clinic?._id === clinicId) &&
    (status === 'all' || appointment.status === status),
  );
}

// Terminal history remains visible even if its referral was never approved.
export function dentistAppointments(appointments: readonly Appointment[], dentistId: string): Appointment[] {
  if (!dentistId) return [];
  return appointments.filter(appointment => appointment.dentist?._id === dentistId &&
    (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.REJECTED ||
      appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.NO_SHOW ||
      !appointment.referral || appointment.referral.status === 'confirmed'));
}

export function dentistClinicOptions(
  user: (ClinicMembership & { _id?: string }) | null,
  appointments: readonly Appointment[],
  directory: readonly Clinic[],
): AppointmentClinicOption[] {
  if (!user?._id) return [];
  const history = appointments.filter(appointment => appointment.dentist?._id === user._id)
    .map(appointment => appointment.clinic).filter((clinic): clinic is Clinic => !!clinic?._id);
  const names = new Map([...assignedClinics(user), ...history, ...directory]
    .map(clinic => [clinic._id, clinic.name]));
  const ids = new Set([...assignedClinicIds(user), ...history.map(clinic => clinic._id ?? '')]);
  return [...ids].filter(Boolean).map(id => ({ id, name: names.get(id) || `Clinic ${id}` }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
