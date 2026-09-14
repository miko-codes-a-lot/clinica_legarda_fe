import { assignedClinicIds, assignedClinics } from './user';
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
