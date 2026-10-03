import { Appointment, AppointmentStatus } from '../../model/appointment';
import { appointmentStatusLabel } from '../../model/appointment-history';
import { appointmentDateKey, formatAppointmentDate } from '../../../dentist/appointment/appointment-schedule';
import { TableColumn, TableFilter, tableOptions } from './table-model';

export const appointmentTableDate = (row: Appointment): string => appointmentDateKey(row.date);
export const APPOINTMENT_TABLE_COLUMNS: readonly TableColumn<Appointment>[] = [
  { key: 'patient', label: 'Patient', cell: row => `${row.patient?.firstName || ''} ${row.patient?.lastName || ''}` },
  { key: 'clinic', label: 'Clinic / dentist', cell: row => row.clinic?.name, secondary: row => `Dr. ${row.dentist?.firstName || ''} ${row.dentist?.lastName || ''}` },
  { key: 'date', label: 'Date', cell: row => formatAppointmentDate(row.date), sortValue: appointmentTableDate },
  { key: 'time', label: 'Time', cell: row => `${row.startTime}–${row.endTime}`, sortValue: row => row.startTime },
  { key: 'visitType', label: 'Visit type', cell: row => row.isWalkIn ? 'Walk-in' : 'Scheduled' },
  { key: 'status', label: 'Status', cell: row => appointmentStatusLabel(row.status), kind: 'status' },
];
export function appointmentTableFilters(rows: readonly Appointment[], includeStatus = false, includeClinic = false): TableFilter<Appointment>[] {
  const filters: TableFilter<Appointment>[] = [{ key: 'visitType', label: 'Visit type', options: [{ value: 'walk_in', label: 'Walk-in' }, { value: 'scheduled', label: 'Scheduled' }], value: row => row.isWalkIn ? 'walk_in' : 'scheduled' }];
  if (includeStatus) filters.unshift({ key: 'status', label: 'Status', options: Object.values(AppointmentStatus).map(value => ({ value, label: appointmentStatusLabel(value) })), value: row => row.status });
  if (includeClinic) filters.unshift({ key: 'clinic', label: 'Clinic', options: tableOptions(rows, row => row.clinic?._id || '', row => row.clinic?.name || ''), value: row => row.clinic?._id || '' });
  return filters;
}
