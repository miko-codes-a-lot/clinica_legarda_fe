import { AppointmentStatus } from './appointment';
import { canCancelAppointment } from './appointment-permissions';
import { dentistAppointment } from '../../dentist/appointment/appointment-test-fixtures';

const patient = (_id: string | undefined) => ({ _id: _id ?? '', role: 'user' });

describe('Appointment cancellation ownership', () => {
  beforeEach(() => { jasmine.clock().install(); jasmine.clock().mockDate(new Date('2026-09-01')); });
  afterEach(() => jasmine.clock().uninstall());
  it('blocks creator cancellation once the Manila scheduled start is reached', () => {
    jasmine.clock().mockDate(new Date('2026-09-10T05:00:00Z'));
    expect(canCancelAppointment(dentistAppointment({ createdBy: 'creator' }), patient('creator'))).toBeFalse();
  });
  it('uses the creator, not the patient, dentist, or most recent history actor', () => {
    const appointment = dentistAppointment({ createdBy: 'creator', history: [
      { action: 'Appointment created.', actorId: 'other', timestamp: new Date() },
    ] });
    expect(canCancelAppointment(appointment, patient('creator'))).toBeTrue();
    expect(canCancelAppointment(appointment, patient(appointment.patient._id))).toBeFalse();
    expect(canCancelAppointment(appointment, patient(appointment.dentist._id))).toBeFalse();
    expect(canCancelAppointment(appointment, patient('other'))).toBeFalse();
  });
  it('recognizes the original creation event on older records but does not guess missing creators', () => {
    const appointment = dentistAppointment({ history: [
      { action: 'Appointment created.', actorId: 'creator', timestamp: new Date() },
      { action: 'Appointment rescheduled.', actorId: 'other', timestamp: new Date() },
    ] });
    expect(canCancelAppointment(appointment, patient('CREATOR'))).toBeTrue();
    expect(canCancelAppointment(appointment, patient('other'))).toBeFalse();
    appointment.history[0].actorId = undefined;
    expect(canCancelAppointment(appointment, patient(appointment.patient._id))).toBeFalse();
    expect(canCancelAppointment(appointment, undefined)).toBeFalse();
  });
  it('allows pending and confirmed bookings only', () => {
    for (const status of Object.values(AppointmentStatus)) {
      expect(canCancelAppointment(dentistAppointment({ createdBy: 'creator', status }), patient('creator')))
        .toBe(status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED);
    }
  });

  it('allows responsible staff to cancel confirmed bookings even when the legacy creator is missing', () => {
    const appointment = dentistAppointment();
    for (const actor of [
      { _id: 'dentist-1', role: 'dentist' },
      { _id: 'admin', role: 'admin', clinics: ['clinic-1'] },
      { _id: 'global-admin', role: 'super-admin' },
    ]) {
      expect(canCancelAppointment(appointment, actor)).toBeTrue();
      expect(canCancelAppointment({ ...appointment, status: AppointmentStatus.PENDING }, actor)).toBeFalse();
      expect(canCancelAppointment({ ...appointment, status: AppointmentStatus.COMPLETED }, actor)).toBeFalse();
    }
  });

  it('does not offer cancellation to an unrelated dentist or an unassigned clinic administrator', () => {
    const appointment = dentistAppointment({ createdBy: 'patient-1' });
    expect(canCancelAppointment(appointment, { _id: 'dentist-2', role: 'dentist' })).toBeFalse();
    expect(canCancelAppointment(appointment, { _id: 'admin', role: 'admin', clinics: ['other-clinic'] })).toBeFalse();
    expect(canCancelAppointment(appointment, { _id: 'admin', role: 'admin', clinics: [] })).toBeFalse();
  });

  it('closes confirmed staff cancellation at the Manila start boundary', () => {
    const appointment = dentistAppointment({ createdBy: 'patient-1' });
    jasmine.clock().mockDate(new Date('2026-09-10T04:59:59.999Z'));
    expect(canCancelAppointment(appointment, { _id: 'dentist-1', role: 'dentist' })).toBeTrue();
    jasmine.clock().mockDate(new Date('2026-09-10T05:00:00Z'));
    expect(canCancelAppointment(appointment, { _id: 'dentist-1', role: 'dentist' })).toBeFalse();
  });
});
