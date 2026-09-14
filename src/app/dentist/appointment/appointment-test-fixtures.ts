import { Appointment, AppointmentStatus } from '../../_shared/model/appointment';
import { User } from '../../_shared/model/user';
import { UserSimple } from '../../_shared/model/user-simple';

export const dentistUser: UserSimple = {
  _id: 'dentist-1', firstName: 'Elena', middleName: '', lastName: 'Reyes',
  emailAddress: 'elena@example.test', mobileNumber: '', address: 'Manila',
  operatingHours: [], role: 'dentist', username: 'elena.reyes',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

export function dentistAppointment(overrides: Partial<Appointment> = {}): Appointment {
  const dentist: User = { ...dentistUser, appointments: [] };
  return {
    _id: 'appointment-1', dentist,
    patient: { ...dentist, _id: 'patient-1', role: 'user', firstName: 'Maria', lastName: 'Santos' },
    clinic: { _id: 'clinic-1', name: 'Clinica Legarda', address: 'Manila', mobileNumber: '', emailAddress: '', operatingHours: [], dentists: [] },
    date: new Date('2026-09-10T00:00:00.000Z'), startTime: '13:00', endTime: '14:00',
    status: AppointmentStatus.CONFIRMED,
    services: [{ _id: 'service-1', name: 'Cleaning', duration: 60 }],
    notes: { clinicNotes: '', patientNotes: '' }, history: [],
    createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}
