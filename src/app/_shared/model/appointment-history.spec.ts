import { AppointmentStatus } from './appointment';
import { appointmentHasEnded, isAppointmentHistory, isPreviousTreatment } from './appointment-history';
import { dentistAppointment } from '../../dentist/appointment/appointment-test-fixtures';

describe('Appointment history eligibility', () => {
  const now = new Date('2026-09-21T02:00:01Z');
  const appointment = dentistAppointment({ date: new Date('2026-09-21T00:00:00Z'), endTime: '10:00' });

  it('retains completed and missed visits but never uses a no-show as previous treatment', () => {
    for (const status of [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW]) {
      const record = { ...appointment, status, date: new Date('2026-09-22T00:00:00Z') };
      expect(isAppointmentHistory(record, now)).toBeTrue();
      expect(isPreviousTreatment(record, now)).toBe(status === AppointmentStatus.COMPLETED);
    }
    expect(isAppointmentHistory(appointment, now)).toBeTrue();
    expect(isPreviousTreatment(appointment, now)).toBeTrue();
    for (const status of [AppointmentStatus.PENDING, AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED]) {
      expect(isPreviousTreatment({ ...appointment, status }, now)).toBeFalse();
    }
  });

  it('uses the actual Manila end instant for legacy confirmed history', () => {
    expect(appointmentHasEnded(appointment, new Date('2026-09-21T02:00:00Z'))).toBeFalse();
    expect(appointmentHasEnded(appointment, now)).toBeTrue();
    expect(isAppointmentHistory(appointment, new Date('2026-09-21T01:59:59Z'))).toBeFalse();
    const midnight = { ...appointment, endTime: '00:15' };
    expect(appointmentHasEnded(midnight, new Date('2026-09-20T16:15:01Z'))).toBeTrue();
    expect(appointmentHasEnded({ ...appointment, endTime: '25:00' }, now)).toBeFalse();
    expect(appointmentHasEnded({ ...appointment, date: new Date(NaN) }, now)).toBeFalse();
  });
});
