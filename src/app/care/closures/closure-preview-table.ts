import { TableColumn, TableFilter, tableOptions } from '../../_shared/component/table/table-model';
import { appointmentStatusLabel } from '../../_shared/model/appointment-history';
import { patientDisplayName } from '../../_shared/model/patient-identity';
import { careDay, APPOINTMENT_STATUS_OPTIONS } from '../care-table-config';
import { AffectedAppointment } from './closure.models';

export function closureDeadline(value?: string): string {
  return value ? new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) + ' (Philippine time)' : 'Manual review';
}
export const closurePreviewColumns: readonly TableColumn<AffectedAppointment>[] = [
  { key: 'patient', label: 'Patient', cell: row => patientDisplayName(row.patient) },
  { key: 'dentist', label: 'Dentist', cell: row => row.dentist ? `${row.dentist.firstName || ''} ${row.dentist.lastName || ''}` : 'Unavailable dentist' },
  { key: 'date', label: 'Original / current schedule', cell: row => careDay(row.date), secondary: row => `${row.startTime}–${row.endTime}`, sortValue: row => row.date + row.startTime },
  { key: 'services', label: 'Services', cell: row => (row.services ?? []).map(service => service?.name || 'Unavailable service').join(', ') || 'Unavailable services' },
  { key: 'status', label: 'Current status', cell: row => appointmentStatusLabel(row.status), kind: 'status' },
  { key: 'effect', label: 'Closure effect', cell: row => row.closureEffect === 'manual_review' ? 'Protected care · manual review' : row.closureEffect === 'already_needs_rescheduling' ? 'Keep existing deadline' : 'Needs rescheduling' },
  { key: 'deadline', label: 'Replacement proposal deadline', cell: row => closureDeadline(row.proposalDeadline), secondary: row => row.closureRescheduling?.expiresAt ? 'Existing deadline' : row.protectedCare ? 'No automatic cancellation' : 'Estimated if confirmed now', sortValue: row => row.proposalDeadline },
];
export function closurePreviewFilters(rows: readonly AffectedAppointment[]): TableFilter<AffectedAppointment>[] {
  const services = rows.flatMap(row => row.services ?? []).filter(service => service !== null);
  return [
    { key: 'status', label: 'Status', options: APPOINTMENT_STATUS_OPTIONS, value: row => row.status },
    { key: 'dentist', label: 'Dentist', options: tableOptions(rows, row => row.dentist?._id || '', row => `${row.dentist?.firstName || ''} ${row.dentist?.lastName || ''}`), value: row => row.dentist?._id || '' },
    { key: 'service', label: 'Service', options: tableOptions(services, service => service._id, service => service.name), value: row => (row.services ?? []).flatMap(service => service ? [service._id] : []) },
  ];
}
