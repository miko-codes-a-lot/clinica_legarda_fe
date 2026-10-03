import { SCHEDULE_TABLE_COLUMNS } from './appointment-table-config';
import { dentistAppointment } from '../../../dentist/appointment/appointment-test-fixtures';
import { matchesTableQuery, sortTableRows, TableColumn, TableFilter, TableQuery } from './table-model';

interface Row { _id: string; name: string; clinic: string; status: string; date: string; amount: number | null; }
const rows: Row[] = [
  { _id: 'private-id-a', name: 'Ana Reyes', clinic: 'Main', status: 'confirmed', date: '2026-02-01', amount: 10000 },
  { _id: 'private-id-b', name: 'Carlo Reyes', clinic: 'East', status: 'pending', date: '2026-01-30', amount: 2000 },
  { _id: 'private-id-c', name: 'Ana Cruz', clinic: 'East', status: 'confirmed', date: '2026-10-02', amount: null },
];
const columns: TableColumn<Row>[] = [
  { key: 'name', label: 'Name', cell: row => row.name },
  { key: 'clinic', label: 'Clinic', cell: row => row.clinic },
  { key: 'date', label: 'Date', cell: row => new Date(row.date).toLocaleDateString('en-US'), sortValue: row => row.date },
  { key: 'amount', label: 'Amount', cell: row => row.amount === null ? '' : `₱${row.amount}`, sortValue: row => row.amount },
];
const filters: TableFilter<Row>[] = [{ key: 'status', label: 'Status', options: [], value: row => row.status }];
const query = (extra: Partial<TableQuery> = {}): TableQuery => ({ search: '', filters: {}, from: '', to: '', ...extra });
describe('Record table data selection', () => {
  it('matches words across visible fields and ignores hidden IDs', () => {
    expect(rows.filter(row => matchesTableQuery(row, columns, filters, query({ search: 'ANA east' })))).toEqual([rows[2]]);
    expect(rows.filter(row => matchesTableQuery(row, columns, filters, query({ search: 'private-id' })))).toEqual([]);
  });
  it('combines search, status and inclusive clinic date bounds', () => {
    const selected = query({ search: 'Ana', filters: { status: 'confirmed' }, from: '2026-02-01', to: '2026-02-01' });
    expect(rows.filter(row => matchesTableQuery(row, columns, filters, selected, row => row.date))).toEqual([rows[0]]);
    expect(matchesTableQuery(rows[0], columns, filters, query({ from: '2026-10-01', to: '2026-01-01' }), row => row.date)).toBeFalse();
  });
  it('supports multi-clinic membership filters without broadening other conditions', () => {
    const memberships: TableFilter<Row>[] = [{ key: 'clinic', label: 'Clinic', options: [], value: row => row.clinic === 'Main' ? ['Main', 'East'] : ['East'] }];
    expect(rows.filter(row => matchesTableQuery(row, columns, memberships, query({ search: 'Reyes', filters: { clinic: 'Main' } })))).toEqual([rows[0]]);
  });
  it('sorts dates and amounts using raw values and keeps missing amounts last', () => {
    expect(sortTableRows(rows, columns, { active: 'date', direction: 'asc' }).map(row => row._id)).toEqual(['private-id-b', 'private-id-a', 'private-id-c']);
    expect(sortTableRows(rows, columns, { active: 'amount', direction: 'desc' }).map(row => row._id)).toEqual(['private-id-a', 'private-id-b', 'private-id-c']);
    expect(sortTableRows(rows, columns, { active: 'amount', direction: 'asc' }).map(row => row._id)).toEqual(['private-id-b', 'private-id-a', 'private-id-c']);
  });
  it('preserves input order when sorting is cleared and does not mutate source data', () => {
    const before = [...rows];
    sortTableRows(rows, columns, { active: 'name', direction: 'desc' });
    expect(rows).toEqual(before);
    expect(sortTableRows(rows, columns, { active: 'name', direction: '' })).toEqual(rows);
  });
});

describe('Dentist schedule visible fields', () => {
  it('finds services and clinics displayed inside the patient cell', () => {
    const appointment = dentistAppointment();
    const visible = SCHEDULE_TABLE_COLUMNS.filter(column => ['time', 'patient', 'status'].includes(column.key));
    expect(matchesTableQuery(appointment, visible, [], query({ search: appointment.services[0].name }))).toBeTrue();
    expect(matchesTableQuery(appointment, visible, [], query({ search: appointment.clinic.name }))).toBeTrue();
    expect(matchesTableQuery(appointment, visible, [], query({ search: appointment._id }))).toBeFalse();
  });
});
