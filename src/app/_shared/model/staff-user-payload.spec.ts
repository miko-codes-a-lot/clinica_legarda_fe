import { OperatingHour } from './operating-hour';
import { buildStaffUserPayload } from './staff-user-payload';

const operatingHours: OperatingHour[] = [
  { day: 'monday', startTime: '09:00', endTime: '17:00' },
];

const profile = {
  firstName: 'Jamie',
  middleName: '',
  lastName: 'Reyes',
  emailAddress: 'jamie@example.test',
  mobileNumber: '+639171234567',
  address: 'Manila',
  username: 'jamie.reyes',
};

describe('staff user payload', () => {
  it('submits every selected clinic for a dentist', () => {
    expect(buildStaffUserPayload({
      ...profile,
      password: 'Password1!',
      role: 'dentist',
      clinics: ['main', 'annex'],
      operatingHours,
    })).toEqual({
      ...profile,
      password: 'Password1!',
      role: 'dentist',
      clinics: ['main', 'annex'],
      operatingHours,
    });
  });

  it('submits the exact remaining assignment after a clinic is removed', () => {
    const payload = buildStaffUserPayload({
      ...profile,
      password: '',
      role: 'dentist',
      clinics: ['annex'],
      operatingHours,
    });

    expect(payload.clinics).toEqual(['annex']);
    expect(payload.password).toBeUndefined();
  });

  it('clears membership and dentist hours for a globally authorized admin role', () => {
    const payload = buildStaffUserPayload({
      ...profile,
      password: '',
      role: 'admin',
      clinics: ['main'],
      operatingHours,
    });

    expect(payload.clinics).toEqual([]);
    expect(payload.operatingHours).toEqual([]);
  });
});
