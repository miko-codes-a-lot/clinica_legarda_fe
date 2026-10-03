import { SUPER_ADMIN_ROUTES } from '../../../super-admin/super-admin.routes';
import { AuthGuard } from '../../guard/auth-guard';
import { Notification } from '../../model/notification';
import { notificationDay, notificationLink } from './notification-table-config';
describe('Notification presentation routing and clinic day', () => {
  it('provides a guarded inbox route for the super-admin view-all link', () => {
    const route = SUPER_ADMIN_ROUTES[0].children?.find(item => item.path === 'notification');
    expect(route?.data?.['role']).toBe('super-admin');
    expect(route?.canActivate).toContain(AuthGuard);
    expect(route?.children?.find(item => item.path === 'list')?.loadComponent).toBeDefined();
  });
  it('keeps staff links within the active staff area', () => {
    expect(notificationLink('/admin/appointment/details/123', 'super-admin')).toBe('/super-admin/appointment/details/123');
    expect(notificationLink('/super-admin/care/closures', 'admin')).toBe('/admin/care/closures');
    expect(notificationLink('/admin/appointment/details/123', 'dentist')).toBe('/dentist/appointment/details/123');
  });
  it('does not turn external links into an actionable notification route', () => {
    expect(notificationLink('https://external.example/record', 'admin')).toBeNull();
    expect(notificationLink('//external.example/record', 'admin')).toBeNull();
    expect(notificationLink(undefined, 'admin')).toBeNull();
  });
  it('filters timestamps by the clinic day at the UTC midnight boundary', () => {
    expect(notificationDay({ createdAt: '2026-10-02T17:00:00Z' } as Notification)).toBe('2026-10-03');
  });
});
