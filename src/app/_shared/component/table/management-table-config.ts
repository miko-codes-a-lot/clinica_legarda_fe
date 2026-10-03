import { User, assignedClinicIds, assignedClinics } from '../../model/user';
import { TableColumn, TableFilter, tableOptions } from './table-model';

export const userRoleLabel = (role: string): string => ({ user: 'Patient', dentist: 'Dentist', admin: 'Admin', 'super-admin': 'Super admin' }[role] ?? role);
export const USER_TABLE_COLUMNS: readonly TableColumn<User>[] = [
  { key: 'name', label: 'Name', cell: user => `${user.firstName} ${user.lastName}`, secondary: user => user.username ?? '' },
  { key: 'role', label: 'Role', cell: user => userRoleLabel(user.role) },
  { key: 'status', label: 'Account', cell: user => user.status ?? 'Unknown', kind: 'status' },
  { key: 'contact', label: 'Contact', cell: user => user.mobileNumber || user.emailAddress || 'No contact recorded', secondary: user => user.mobileNumber ? user.emailAddress || '' : '' },
  { key: 'clinics', label: 'Clinics', cell: user => assignedClinics(user).map(clinic => clinic.name).join(', ') },
];
export function userTableFilters(users: readonly User[]): TableFilter<User>[] {
  const clinics = users.flatMap(user => assignedClinics(user));
  const filters: TableFilter<User>[] = [
    { key: 'role', label: 'Role', options: tableOptions(users, user => user.role, user => userRoleLabel(user.role)), value: user => user.role },
    { key: 'status', label: 'Account', options: [{ value: 'confirmed', label: 'Confirmed' }, { value: 'pending', label: 'Pending verification' }, { value: 'walk_in', label: 'Walk-in' }, { value: 'rejected', label: 'Rejected' }], value: user => user.status ?? '' },
  ];
  if (clinics.length) filters.push({ key: 'clinic', label: 'Clinic', options: tableOptions(clinics, clinic => clinic._id ?? '', clinic => clinic.name), value: user => assignedClinicIds(user) });
  return filters;
}
