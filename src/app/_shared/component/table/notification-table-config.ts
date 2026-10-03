import { Notification, NotificationType } from '../../model/notification';
import { TableColumn, TableFilter } from './table-model';
export type NotificationArea = 'admin' | 'super-admin' | 'dentist';
export function notificationLink(link: string | undefined, area: NotificationArea): string | null {
  if (!link?.startsWith('/') || link.startsWith('//')) return null;
  return link.replace(/^\/(?:admin|super-admin|dentist)(?=\/)/, `/${area}`);
}
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
const timestampFormatter = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
export function notificationDay(row: Notification): string {
  const date = new Date(row.createdAt);
  return Number.isNaN(date.getTime()) ? '' : dayFormatter.format(date);
}
export function notificationTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : timestampFormatter.format(date);
}
export function notificationTypeLabel(type: NotificationType): string {
  return type === NotificationType.APPOINTMENT_CREATED ? 'New booking' : type === NotificationType.APPOINTMENT_REMINDER ? 'Reminder' : 'Status update';
}
export const NOTIFICATION_COLUMNS: readonly TableColumn<Notification>[] = [
  { key: 'type', label: 'Type', cell: row => notificationTypeLabel(row.type) },
  { key: 'message', label: 'Notification', cell: row => row.message },
  { key: 'createdAt', label: 'Received', cell: row => notificationTimestamp(row.createdAt), sortValue: row => new Date(row.createdAt).getTime() },
  { key: 'status', label: 'Status', cell: row => row.read ? 'Read' : 'Unread', kind: 'status' },
];
export const NOTIFICATION_FILTERS: readonly TableFilter<Notification>[] = [
  { key: 'type', label: 'Type', options: Object.values(NotificationType).map(value => ({ value, label: notificationTypeLabel(value) })), value: row => row.type },
  { key: 'read', label: 'Status', options: [{ value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }], value: row => row.read ? 'read' : 'unread' },
];
