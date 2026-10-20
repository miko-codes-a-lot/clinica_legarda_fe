import { patientDisplayName, isRetainedPatient } from './patient-identity';
import { isOnlineBookablePatient, isStaffBookablePatient, UserStatus } from './user';

describe('retained patient identity', () => {
  it('distinguishes deleted identities from legacy missing references', () => {
    expect(patientDisplayName({ firstName: 'Alex', lastName: 'Rivera', deletedAt: '2026-10-21T00:00:00Z' })).toBe('Alex Rivera (Deleted patient)');
    expect(patientDisplayName(null)).toBe('Unknown patient');
    expect(patientDisplayName(undefined)).toBe('Unknown patient');
    expect(patientDisplayName({ deletedAt: '2026-10-21' })).toBe('Deleted patient');
  });
  it('keeps ordinary patient labels unchanged', () => {
    expect(patientDisplayName({ firstName: 'Alex', lastName: 'Rivera' })).toBe('Alex Rivera');
    expect(isRetainedPatient(null)).toBeTrue();
    expect(isRetainedPatient({ deletedAt: '2026-10-21' })).toBeTrue();
    expect(isRetainedPatient({ firstName: 'Alex' })).toBeFalse();
  });
  it('does not offer booking for a deleted account whose old status is confirmed', () => {
    const patient = Object.assign({ role: 'user', status: UserStatus.CONFIRMED }, { deletedAt: '2026-10-21' });
    expect(isOnlineBookablePatient(patient)).toBeFalse();
    expect(isStaffBookablePatient(patient)).toBeFalse();
  });
});
