import { createPatientRecordReport, createPatientRecordPdf, renderPatientRecordReport } from './patient-record-report';
import { PatientRecordSnapshot } from '../care.models';

const person = { _id: 'RAW_PATIENT_ID', firstName: 'Ana', lastName: 'Patient', emailAddress: 'ana@clinic-mail.ph', address: 'Manila' };
const clinic = { _id: 'RAW_CLINIC_ID', name: 'Test clinic' }, dentist = { _id: 'RAW_DENTIST_ID', firstName: 'Test', lastName: 'Dentist' };
const snapshot = (): PatientRecordSnapshot => ({ record: { patient: person, appointments: [{ _id: 'RAW_APPOINTMENT_ID', clinic, dentist, date: '2026-10-21', startTime: '09:00', endTime: '09:30', status: 'confirmed', services: [{ _id: 'RAW_SERVICE_ID', name: 'Cleaning' }] }] },
  visits: [], cases: [], generatedAt: '2026-10-20T00:00:00Z', scopeLabel: 'Assigned clinics' });
describe('Staff patient record export', () => {
  it('prints a readable patient identity and care history without database identifiers', () => {
    const report = createPatientRecordReport(snapshot()), doc = document.implementation.createHTMLDocument(); renderPatientRecordReport(doc, report);
    expect(doc.body.textContent).toContain('Ana Patient'); expect(doc.body.textContent).toContain('Cleaning'); expect(doc.body.textContent).toContain('Assigned clinics');
    expect(doc.body.textContent).not.toMatch(/RAW_|Record ID/); expect(createPatientRecordPdf(report).output()).not.toContain('RAW_');
  });
  it('includes optional patient details and age on the report generation date', () => {
    const value = snapshot(); value.record.patient = { ...person, birthDate: '2000-10-21', sex: 'Female', occupation: 'Student', religion: 'Optional belief', maritalStatus: 'Single' };
    const rows = createPatientRecordReport(value).tables[0].rows;
    expect(rows).toContain(['Age','25']); expect(rows).toContain(['Birth date','Oct 21, 2000']);
    expect(rows).toContain(['Occupation','Student']); expect(rows).toContain(['Religion','Optional belief']);
  });
  it('exports both dentitions with the correct patient, clinic, author and tooth observations', () => {
    const value = snapshot(); value.record.appointments = []; value.charts = [{ _id: 'RAW_CHART_ID', patient: 'RAW_PATIENT_ID', clinic, dentition: 'permanent', revision: 2, teeth: [{ tooth: 11, observation: 'Permanent observation', notes: 'Manual note' }], updatedBy: dentist, updatedAt: value.generatedAt }, { _id: 'RAW_PRIMARY_ID', patient: 'RAW_PATIENT_ID', clinic, dentition: 'primary', revision: 1, teeth: [{ tooth: 51, observation: 'Primary observation', notes: '' }], updatedBy: dentist, updatedAt: value.generatedAt }];
    const report = createPatientRecordReport(value), permanent = report.tables.find(table => table.title === 'Dental chart - permanent'), primary = report.tables.find(table => table.title === 'Dental chart - primary');
    expect(report.tables[0].rows).toContain(['Appointments','No appointments in the authorized scope.']);
    expect(report.tables.some(table => table.title === 'Appointment history')).toBeFalse();
    expect(permanent?.rows).toHaveSize(32); expect(primary?.rows).toHaveSize(20);
    expect(permanent?.rows).toContain(['11','Permanent observation','Manual note']); expect(primary?.rows).toContain(['51','Primary observation','']);
    expect(permanent?.scope).toContain('Ana Patient; Test clinic; Revision 2; Test Dentist');
    const doc = document.implementation.createHTMLDocument(); renderPatientRecordReport(doc, report); expect(doc.body.textContent).not.toContain('RAW_');
  });
  it('has truthful empty states and treats patient text as inert text', () => {
    const value = snapshot(); value.record.patient = { ...person, firstName: '<script>Patient</script>' }; value.record.appointments = [];
    const report = createPatientRecordReport(value), doc = document.implementation.createHTMLDocument(); renderPatientRecordReport(doc, report);
    expect(doc.querySelector('script')).toBeNull(); expect(doc.body.textContent).toContain('<script>Patient</script>'); expect(doc.body.textContent).toContain('No appointments');
  });
  it('paginates long clinical notes without dropping their final text or exposing raw references', () => {
    const value = snapshot(); value.visits = [{ _id: 'RAW_VISIT_ID', patient: person, clinic, dentist, date: '2026-10-21', state: 'completed', purpose: 'consultation', checkedInAt: '2026-10-21T01:00:00Z', isWalkIn: false, revision: 1, events: [],
      assessment: 'Long clinical observation. '.repeat(500) + 'FINAL_OBSERVATION', treatments: [], summary: 'Published summary', aftercare: 'Aftercare', nextSteps: 'Next visit' }];
    const pdf = createPatientRecordPdf(createPatientRecordReport(value)); expect(pdf.getNumberOfPages()).toBeGreaterThan(3);
    expect(pdf.output()).toContain('FINAL_OBSERVATION'); expect(pdf.output()).not.toContain('RAW_');
    let y = 0, leading = 0;
    for (const line of pdf.output().split('\n')) {
      const position = line.match(/^[\d.-]+ ([\d.-]+) Td$/), lineHeight = line.match(/^([\d.-]+) TL$/);
      if (position) y = Number(position[1]); if (lineHeight) leading = Number(lineHeight[1]);
      if (line.startsWith('T*')) y -= leading;
      if (line.includes('Tj')) expect(y).withContext('PDF text must remain inside the page').toBeGreaterThanOrEqual(15);
    }
  });
});
