import { AppointmentStatus } from '../../_shared/model/appointment';
import { requiresAppointmentOutcome } from './appointment-schedule';
import { dentistAppointment } from './appointment-test-fixtures';

describe('Dentist outcome reminders', () => {
  const appointment = dentistAppointment({ date: new Date('2026-09-21T00:00:00Z'), endTime: '10:00' });

  it('requires an outcome only strictly after the scheduled Manila end instant', () => {
    expect(requiresAppointmentOutcome(appointment, new Date('2026-09-21T02:00:00Z'))).toBeFalse();
    expect(requiresAppointmentOutcome(appointment, new Date('2026-09-21T02:00:01Z'))).toBeTrue();
    expect(requiresAppointmentOutcome(appointment, new Date('2026-09-22T01:00:00Z'))).toBeTrue();
    expect(requiresAppointmentOutcome(appointment, new Date('2026-09-20T23:00:00Z'))).toBeFalse();
  });

  it('clears the reminder when the saved record is resolved or rescheduled', () => {
    const now = new Date('2026-09-21T02:00:01Z');
    for (const status of [AppointmentStatus.PENDING, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW,
      AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED]) {
      expect(requiresAppointmentOutcome({ ...appointment, status }, now)).withContext(status).toBeFalse();
    }
    expect(requiresAppointmentOutcome({ ...appointment, date: new Date('2026-09-22T00:00:00Z') }, now)).toBeFalse();
  });
});
