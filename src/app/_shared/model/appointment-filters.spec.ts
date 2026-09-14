import { dentistAppointment, dentistUser } from '../../dentist/appointment/appointment-test-fixtures';
import { AppointmentStatus } from './appointment';
import { dentistAppointments, dentistClinicOptions, filterAppointments } from './appointment-filters';
import { Clinic } from './clinic';
import { ReferralStatus } from './referral';

describe('Appointment clinic scope', () => {
  const main = dentistAppointment().clinic;
  const empty: Clinic = { ...main, _id: 'empty', name: 'Empty assigned clinic' };
  const former: Clinic = { ...main, _id: 'former', name: 'Former clinic' };
  const other: Clinic = { ...main, _id: 'other', name: 'Other clinic' };
  const own = dentistAppointment();
  const history = dentistAppointment({ _id: 'history', clinic: former, status: AppointmentStatus.COMPLETED });
  const forged = dentistAppointment({ _id: 'forged', clinic: other, dentist: { ...own.dentist, _id: 'another-dentist' } });

  it('keeps assigned empty clinics and own history without exposing another dentist at any clinic', () => {
    const user = { ...dentistUser, clinics: [main, 'empty'] };
    const records = [own, history, forged, { ...forged, _id: 'forged-shared-clinic', clinic: main }];
    expect(dentistAppointments(records, user._id).map(appointment => appointment._id)).toEqual([own._id, 'history']);
    expect(dentistClinicOptions(user, records, [main, empty, other])).toEqual([
      { id: 'clinic-1', name: main.name }, { id: 'empty', name: empty.name }, { id: 'former', name: former.name },
    ]);
    expect(filterAppointments(dentistAppointments(records, user._id), 'empty')).toEqual([]);
    expect(dentistAppointments(records, '')).toEqual([]);
    expect(dentistClinicOptions(null, records, [main, empty, other])).toEqual([]);
  });

  it('respects revoked explicit assignments and legacy fallback while retaining own historical clinics', () => {
    expect(dentistClinicOptions({ ...dentistUser, clinic: empty, clinics: [] }, [history, forged], [empty, other]))
      .toEqual([{ id: 'former', name: former.name }]);
    expect(dentistClinicOptions({ ...dentistUser, clinic: empty }, [], [empty, other]))
      .toEqual([{ id: 'empty', name: empty.name }]);
  });

  it('combines clinic and status without dropping terminal history or mutating the supplied records', () => {
    const pending = dentistAppointment({ _id: 'pending', status: AppointmentStatus.PENDING });
    const records = Object.freeze([own, history, pending]);
    expect(filterAppointments(records, main._id, AppointmentStatus.PENDING)).toEqual([pending]);
    expect(filterAppointments(records, 'former', AppointmentStatus.PENDING)).toEqual([]);
    expect(filterAppointments(records, 'former')).toEqual([history]);
    expect(filterAppointments(records, 'all', AppointmentStatus.COMPLETED)).toEqual([history]);
    expect(filterAppointments(records)).toEqual([own, history, pending]);
  });

  it('retains terminal appointments with unapproved referrals while hiding unapproved active referrals', () => {
    const referral = { _id: 'referral', status: ReferralStatus.PENDING, appointment: own,
      fromDoctorId: own.dentist, fromClinicId: main, reasonOfDecline: '' };
    const statuses: AppointmentStatus[] = [AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED,
      AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW, AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
    const records = statuses.map(status => dentistAppointment({ _id: status, status, referral }));
    expect(dentistAppointments(records, dentistUser._id).map(appointment => appointment.status))
      .toEqual([AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW]);
  });
});
