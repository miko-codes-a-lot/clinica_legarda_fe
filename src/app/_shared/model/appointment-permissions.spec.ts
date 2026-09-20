import { AppointmentStatus } from './appointment';
import { canCancelAppointment } from './appointment-permissions';
import { dentistAppointment } from '../../dentist/appointment/appointment-test-fixtures';

describe('Appointment cancellation ownership', () => {
  it('uses the creator, not the patient, dentist, or most recent history actor', () => {
    const appointment = dentistAppointment({ createdBy: 'creator', history: [
      { action: 'Appointment created.', actorId: 'other', timestamp: new Date() },
    ] });
    expect(canCancelAppointment(appointment, 'creator')).toBeTrue();
    expect(canCancelAppointment(appointment, appointment.patient._id)).toBeFalse();
    expect(canCancelAppointment(appointment, appointment.dentist._id)).toBeFalse();
    expect(canCancelAppointment(appointment, 'other')).toBeFalse();
  });
  it('recognizes the original creation event on older records but does not guess missing creators', () => {
    const appointment = dentistAppointment({ history: [
      { action: 'Appointment created.', actorId: 'creator', timestamp: new Date() },
      { action: 'Appointment rescheduled.', actorId: 'other', timestamp: new Date() },
    ] });
    expect(canCancelAppointment(appointment, 'CREATOR')).toBeTrue();
    expect(canCancelAppointment(appointment, 'other')).toBeFalse();
    appointment.history[0].actorId = undefined;
    expect(canCancelAppointment(appointment, appointment.patient._id)).toBeFalse();
    expect(canCancelAppointment(appointment, undefined)).toBeFalse();
  });
  it('allows pending and confirmed bookings only', () => {
    for (const status of Object.values(AppointmentStatus)) {
      expect(canCancelAppointment(dentistAppointment({ createdBy: 'creator', status }), 'creator'))
        .toBe(status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED);
    }
  });
});
