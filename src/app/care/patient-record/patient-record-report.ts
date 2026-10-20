import { patientDisplayName } from '../../_shared/model/patient-identity';
import { chartAuthorName, chartQuadrants } from '../dental-chart/dental-chart.models';
import { patientAge, manilaDay } from '../../_shared/model/patient-demographics';
import { PatientRecordSnapshot, CarePerson } from '../care.models';
import { createDashboardPdf, renderDashboardReport, DashboardReport, DashboardReportTable } from '../../admin/dashboard/dashboard-index/dashboard-report';
import { formatReportDate } from '../../_shared/model/analytics-report';
export type PatientRecordReport = DashboardReport;
const personName = (person: CarePerson | null | undefined) => [person?.firstName, person?.middleName, person?.lastName].filter(Boolean).join(' ') || 'Not recorded';
const date = (value: string) => formatReportDate(value.slice(0,10));
export function createPatientRecordReport(snapshot: PatientRecordSnapshot): PatientRecordReport {
  const patient = snapshot.record.patient, name = patientDisplayName(patient), scope = `${name}; ${snapshot.scopeLabel}`;
  const tables: DashboardReportTable[] = [{ title: 'Patient details', scope, headers: ['Field','Details'], columnWidths: [.28,.72], rows: [
    ['Name',name], ...(patient.isDependent ? [['Patient account','Managed by parent; no independent sign-in']] : []), ['Account status',patient.deletedAt ? 'Deleted patient (retained history)' : patient.status ?? 'Not recorded'], ['Email',patient.emailAddress || 'Not recorded'],
    ['Mobile number',patient.mobileNumber || 'Not recorded'], ['Address',patient.address || 'Not recorded'],
    ['Birth date',patient.birthDate ? date(patient.birthDate) : 'Not recorded'], ['Age',String(patientAge(patient.birthDate, manilaDay(new Date(snapshot.generatedAt))) ?? 'Not recorded')],
    ['Sex',patient.sex || 'Not recorded'], ['Occupation',patient.occupation || 'Not recorded'], ['Religion',patient.religion || 'Not recorded'], ['Marital status',patient.maritalStatus || 'Not recorded'],
  ] }, { title: 'Appointment history', scope, headers: ['Schedule','Clinic / dentist','Services','Status'], columnWidths: [.23,.3,.3,.17],
    rows: snapshot.record.appointments.length ? snapshot.record.appointments.map(row => [ `${date(row.date)}\n${row.startTime}-${row.endTime}`, `${row.clinic?.name || 'Not recorded'}\nDr. ${personName(row.dentist)}`, row.services.map(service => service.name).join(', '), row.status === 'no_show' ? 'No-show' : row.status ]) : [['No appointments in the authorized scope.','','','']] }];
  if (!snapshot.visits.length) tables.push({ title: 'Visit history', scope, headers: ['Details'], columnWidths: [1], rows: [['No visit records in the authorized scope.']] });
  for (const visit of snapshot.visits) tables.push({ title: `Visit - ${date(visit.date)}`, scope, headers: ['Field','Clinical record'], columnWidths: [.25,.75], rows: [
    ['Clinic / dentist',`${visit.clinic?.name || 'Not recorded'}\nDr. ${personName(visit.dentist)}`], ['Purpose / status',`${visit.purpose} / ${visit.state}`],
    ['Assessment',visit.assessment || 'Not recorded'], ['Treatments',visit.treatments.map(item => [item.description, item.tooth ? `Tooth ${item.tooth}` : '',item.notes].filter(Boolean).join(' - ')).join('\n') || 'None recorded'],
    ['Visit summary',visit.summary || 'Not recorded'], ['Aftercare',visit.aftercare || 'Not recorded'], ['Next steps',visit.nextSteps || 'Not recorded'],
  ] });
  if (!snapshot.cases.length) tables.push({ title: 'Treatment cases', scope, headers: ['Details'], columnWidths: [1], rows: [['No treatment cases in the authorized scope.']] });
  for (const careCase of snapshot.cases) tables.push({ title: `Treatment case - ${careCase.title}`, scope, headers: ['Field','Details'], columnWidths: [.25,.75], rows: [
    ['Clinic / dentist',`${careCase.clinic?.name || 'Not recorded'}\nDr. ${personName(careCase.dentist)}`], ['Status',careCase.status], ['Treatment plan',careCase.plan || 'Not recorded'], ['Clinical notes',careCase.internalNotes || 'Not recorded'],
  ] });
  for (const chart of snapshot.charts ?? []) {
    const chartScope = `${name}; ${chart.clinic.name}; Revision ${chart.revision}; ${chartAuthorName(chart.updatedBy)}; ${new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(chart.updatedAt))} (Manila)`;
    tables.push({ title: `Dental chart - ${chart.dentition}`, scope: chartScope, headers: ['Tooth','Clinician observation','Notes'], columnWidths: [.12,.48,.4], rows: chartQuadrants(chart.dentition).flatMap(quadrant => quadrant.teeth).map(tooth => {
      const entry = chart.teeth.find(item => item.tooth === tooth); return [String(tooth),entry?.observation || 'No observation entered',entry?.notes || ''];
    }) });
  }
  if (!snapshot.record.appointments.length && !snapshot.visits.length && !snapshot.cases.length) {
    const charts = tables.filter(table => table.title.startsWith('Dental chart - '));
    tables.splice(1);
    tables.push(...charts);
    tables[0] = { ...tables[0], rows: [...tables[0].rows, ['Appointments','No appointments in the authorized scope.'],
      ['Visit history','No visit records in the authorized scope.'], ['Treatment cases','No treatment cases in the authorized scope.']] };
  }
  return { title: `Patient record - ${name}`, clinic: snapshot.scopeLabel, period: 'Care history in the authorized scope', generatedAt: snapshot.generatedAt, tables };
}
export const createPatientRecordPdf = createDashboardPdf;
export const renderPatientRecordReport = renderDashboardReport;
