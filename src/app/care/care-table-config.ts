import { TableColumn, TableFilter } from '../_shared/component/table/table-model';
import { CareAppointment, CarePerson, CareVisit, TreatmentCaseDetail } from './care.models';
import { AffectedAppointment } from './closures/closure.models';
import { InstallmentPlan, LedgerEntry } from './ledger/ledger.models';
import { formatPesos } from './ledger/ledger-rules';
import { formatReportDate } from '../_shared/model/analytics-report';

export const careDay = (key: string): string => key ? formatReportDate(key.slice(0, 10)) : '';
export const CARE_PERSON_COLUMNS: TableColumn<CarePerson>[] = [
  { key: 'name', label: 'Patient', cell: row => `${row.firstName} ${row.lastName}`, secondary: row => row.username || '' },
  { key: 'emailAddress', label: 'Email', cell: row => row.emailAddress },
  { key: 'mobileNumber', label: 'Phone', cell: row => row.mobileNumber },
  { key: 'status', label: 'Account', cell: row => row.status, secondary: row => row.isWalkIn ? 'Walk-in registration' : '', kind: 'status' },
];
export const CARE_APPOINTMENT_COLUMNS: TableColumn<CareAppointment>[] = [
  { key: 'date', label: 'Date / time', cell: row => careDay(row.date), secondary: row => `${row.startTime}–${row.endTime}`, sortValue: row => row.date + row.startTime },
  { key: 'clinic', label: 'Clinic / dentist', cell: row => row.clinic.name, secondary: row => `${row.dentist.firstName} ${row.dentist.lastName}` },
  { key: 'services', label: 'Services', cell: row => row.services.map(service => service.name).join(', ') },
  { key: 'status', label: 'Status', cell: row => row.status, kind: 'status' },
];
export const APPOINTMENT_STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'no_show', 'cancelled', 'rejected'].map(value => ({ value, label: value.replace('_', ' ').replace(/^./, letter => letter.toUpperCase()) }));
export const CARE_APPOINTMENT_FILTERS: TableFilter<CareAppointment>[] = [{ key: 'status', label: 'Status', options: APPOINTMENT_STATUS_OPTIONS, value: row => row.status }];
export const careAppointmentDate = (row: { date: string }): string => row.date;
type LinkedAppointment = TreatmentCaseDetail['appointments'][number];
export const LINKED_APPOINTMENT_COLUMNS: TableColumn<LinkedAppointment>[] = [
  { key: 'date', label: 'Date / time', cell: row => careDay(row.date), secondary: row => `${row.startTime}–${row.endTime}`, sortValue: row => row.date + row.startTime },
  { key: 'services', label: 'Services', cell: row => row.services.map(service => service.name).join(', ') },
  { key: 'status', label: 'Status', cell: row => row.status, kind: 'status' },
];
export const LINKED_APPOINTMENT_FILTERS: TableFilter<LinkedAppointment>[] = [{ key: 'status', label: 'Status', options: APPOINTMENT_STATUS_OPTIONS, value: row => row.status }];
export const FINISHED_VISIT_COLUMNS: TableColumn<CareVisit>[] = [
  { key: 'patient', label: 'Patient', cell: row => `${row.patient.firstName} ${row.patient.lastName}` },
  { key: 'clinic', label: 'Clinic / dentist', cell: row => row.clinic.name, secondary: row => `${row.dentist.firstName} ${row.dentist.lastName}` },
  { key: 'purpose', label: 'Visit', cell: row => row.purpose, secondary: row => row.isWalkIn ? 'Walk-in' : 'Scheduled' },
  { key: 'state', label: 'Status', cell: row => row.state, kind: 'status' },
  { key: 'endedAt', label: 'Ended', cell: row => row.endedAt ? new Date(row.endedAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) : '', sortValue: row => row.endedAt },
];
export const FINISHED_VISIT_FILTERS: TableFilter<CareVisit>[] = [
  { key: 'state', label: 'Status', options: [{ value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }], value: row => row.state },
  { key: 'purpose', label: 'Visit', options: [{ value: 'consultation', label: 'Consultation' }, { value: 'treatment', label: 'Treatment' }], value: row => row.purpose },
];
export const AFFECTED_APPOINTMENT_COLUMNS: TableColumn<AffectedAppointment>[] = [
  { key: 'patient', label: 'Patient / dentist', cell: row => `${row.patient.firstName} ${row.patient.lastName}`, secondary: row => `${row.dentist.firstName} ${row.dentist.lastName}` },
  { key: 'date', label: 'Schedule', cell: row => careDay(row.date), secondary: row => `${row.startTime}–${row.endTime}`, sortValue: row => row.date + row.startTime },
  { key: 'status', label: 'Status', cell: row => row.status, kind: 'status' },
  { key: 'flag', label: 'Closure review', cell: row => row.disruption ? 'Needs review' : 'Resolved' },
];
export const AFFECTED_APPOINTMENT_FILTERS: TableFilter<AffectedAppointment>[] = [{ key: 'flag', label: 'Closure review', options: [{ value: 'open', label: 'Needs review' }, { value: 'resolved', label: 'Resolved' }], value: row => row.disruption ? 'open' : 'resolved' }];
type InstallmentRow = InstallmentPlan['items'][number];
export const INSTALLMENT_COLUMNS: TableColumn<InstallmentRow>[] = [
  { key: 'dueDate', label: 'Due date', cell: row => careDay(row.dueDate), sortValue: row => row.dueDate },
  { key: 'amount', label: 'Amount', cell: row => formatPesos(row.amount), sortValue: row => row.amount, kind: 'number' },
  { key: 'paid', label: 'Paid', cell: row => formatPesos(row.paid), sortValue: row => row.paid, kind: 'number' },
  { key: 'remaining', label: 'Remaining', cell: row => formatPesos(row.remaining), sortValue: row => row.remaining, kind: 'number' },
];
export const LEDGER_ENTRY_COLUMNS: TableColumn<LedgerEntry>[] = [
  { key: 'date', label: 'Date / entry', cell: row => careDay(row.date), secondary: row => row.kind === 'charge' ? 'Charge' : 'Payment', sortValue: row => row.date + row.createdAt },
  { key: 'description', label: 'Description / clinic', cell: row => row.description, secondary: row => row.clinic.name },
  { key: 'amount', label: 'Amount', cell: row => formatPesos(row.amount), sortValue: row => row.amount, kind: 'number' },
  { key: 'status', label: 'Status', cell: row => row.voidedAt ? 'Voided' : 'Active', secondary: row => row.voidReason || '', kind: 'status' },
  { key: 'receipt', label: 'Method / receipt', cell: row => row.method || '', secondary: row => row.reference || '' },
];
export const LEDGER_ENTRY_FILTERS: TableFilter<LedgerEntry>[] = [
  { key: 'kind', label: 'Entry', options: [{ value: 'charge', label: 'Charge' }, { value: 'payment', label: 'Payment' }], value: row => row.kind },
  { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'voided', label: 'Voided' }], value: row => row.voidedAt ? 'voided' : 'active' },
];
