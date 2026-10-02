import { assignedClinicIds, assignedClinics, isStaffBookablePatient, isOnlineBookablePatient, UserStatus } from './user';
import { Clinic } from './clinic';

const clinic: Clinic = { _id: 'main', name: 'Main Clinic', address: '', mobileNumber: '', emailAddress: '', operatingHours: [], dentists: [] };

describe('Clinic membership', () => {
  it('keeps a legacy clinic when multiple assignments have not been saved', () => {
    expect(assignedClinicIds({ clinic })).toEqual(['main']);
    expect(assignedClinics({ clinic })).toEqual([clinic]);
  });

  it('uses all explicit assignments instead of the legacy value', () => {
    expect(assignedClinicIds({ clinic, clinics: ['annex', { ...clinic, _id: 'branch' }] })).toEqual(['annex', 'branch']);
  });

  it('does not restore a revoked assignment from the legacy field', () => {
    expect(assignedClinicIds({ clinic, clinics: [] })).toEqual([]);
    expect(assignedClinics({ clinic, clinics: [] })).toEqual([]);
  });
});

describe('staff patient booking eligibility', () => {
  for (const status of Object.values(UserStatus)) {
    it(`uses the API patient eligibility for ${status}`, () => {
      expect(isStaffBookablePatient({ role: 'user', status })).toBe(status === UserStatus.CONFIRMED || status === UserStatus.WALK_IN);
      expect(isStaffBookablePatient({ role: 'dentist', status })).toBeFalse();
      expect(isOnlineBookablePatient({ role: 'user', status })).toBe(status === UserStatus.CONFIRMED);
    });
  }
  it('does not treat a missing patient status as confirmed', () => {
    expect(isStaffBookablePatient({ role: 'user' })).toBeFalse();
  });
});
