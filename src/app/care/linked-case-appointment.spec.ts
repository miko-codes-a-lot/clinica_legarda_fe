import { dentistAppointment } from '../dentist/appointment/appointment-test-fixtures';
import { TreatmentCase } from './care.models';
import { linkedCaseAppointment } from './linked-case-appointment';

describe('linked treatment session booking context', () => {
  const base = dentistAppointment();
  const careCase: TreatmentCase = { _id: 'case-1', patient: { _id: base.patient._id ?? '', firstName: base.patient.firstName, lastName: base.patient.lastName }, clinic: { _id: base.clinic._id ?? '', name: base.clinic.name }, dentist: { _id: base.dentist._id ?? '', firstName: base.dentist.firstName, lastName: base.dentist.lastName }, consultationVisit: 'visit-1', title: 'Case', plan: 'Patient plan', internalNotes: '', status: 'active', revision: 0, createdAt: '2026-10-03' };
  it('prefills the same patient, clinic and dentist without reusing the previous appointment identity', () => {
    const result = linkedCaseAppointment({ ...base, _id: '' }, careCase, [base.clinic], [base.patient]);
    expect(result.careCase).toBe('case-1');
    expect(result.patient._id).toBe(careCase.patient._id);
    expect(result.clinic._id).toBe(careCase.clinic._id);
    expect(result.dentist._id).toBe(careCase.dentist._id);
    expect(result._id).toBe('');
  });
  it('refuses a closed case before opening a booking form', () => {
    expect(() => linkedCaseAppointment(base, { ...careCase, status: 'completed' }, [base.clinic], [base.patient])).toThrow();
  });
  it('refuses a case whose clinic is no longer available to the staff user', () => {
    expect(() => linkedCaseAppointment(base, careCase, [], [base.patient])).toThrow();
  });
  it('refuses a case whose identified patient is no longer in the staff directory', () => {
    expect(() => linkedCaseAppointment(base, careCase, [base.clinic], [])).toThrow();
  });
});
