import { createDashboardReport, DashboardReportInput } from './dashboard-report';
import { formatReportDate } from '../../../_shared/model/analytics-report';

// Report business values are verified without rendering components, tables or PDFs.
const input: DashboardReportInput = {
  title: 'Admin Dashboard Report', clinic: 'Legarda Clinic',
  weekOf: '2026-09-07', weekEnd: '2026-09-13', today: '2026-09-08',
  services: { labels: ['Cleaning <routine>'], datasets: [{ data: [3] }] },
  appointments: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [
    { data: [2, 1, 0, 0, 0, 0, 0] }, { data: [1, 0, 0, 0, 0, 0, 0] },
  ] },
  serviceTrend: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [
    { label: 'Cleaning <routine>', data: [2, 1, 0, 0, 0, 0, 0] },
  ] },
  declinedReferrals: { labels: ['Service unavailable'], datasets: [{ data: [1] }] },
  metrics: { totalAppointments: 3, appointmentsUpdated: 4, queueCount: 1 },
  queue: [{ time: '09:00', patient: 'Test Patient', services: 'Cleaning, Checkup', clinic: 'Legarda Clinic' }],
  notifications: [{ type: 'Status Update', message: 'Notice', timestamp: 'Sep 8', status: 'Unread' }],
};

function table(title: string, reportInput = input) {
  const result = createDashboardReport(reportInput).tables.find(item => item.title === title);
  if (!result) throw new Error(`Missing report table: ${title}`);
  return result;
}

describe('Staff report values and scope', () => {
  it('preserves authoritative totals, actual completed counts and appointments updated', () => {
    expect(table('Dashboard Metrics').rows.map(row => row.slice(0, 2))).toEqual([
      ['Total Appointments', '3'], ['Appointments updated', '4'], ["Today's Queue", '1'],
    ]);
    expect(table('Weekly Appointment Trend').rows[0]).toEqual(['Sep 7, 2026', 'Mon', '2', '1']);
    expect(table('Preferred Services Distribution').rows).toEqual([['Cleaning <routine>', '3', '100.0%']]);
    expect(table('Service Trend per Day').rows[1]).toEqual(['Sep 8, 2026', 'Tue', 'Cleaning <routine>', '1']);
  });

  it('names the selected scope and complete appointment-date week for every weekly series', () => {
    const report = createDashboardReport(input);
    expect(report.week).toBe('Sep 7, 2026 - Sep 13, 2026');
    for (const title of ['Preferred Services Distribution', 'Weekly Appointment Trend', 'Service Trend per Day', 'Declined Referrals by Reason']) {
      expect(table(title).scope).toContain('Legarda Clinic; Sep 7, 2026 - Sep 13, 2026');
    }
    expect(table('Declined Referrals by Reason').scope).toContain('receiving appointment');
    expect(table('Dashboard Metrics').rows[0][2]).toContain('all statuses');
    expect(table('Dashboard Metrics').rows[1][2]).toContain('updated in Manila time');
  });

  it('uses calendar date keys without the browser time zone shifting report days', () => {
    expect(formatReportDate('2026-09-07')).toBe('Sep 7, 2026');
    expect(table('Weekly Appointment Trend').rows[6][0]).toBe('Sep 13, 2026');
    const formatter = spyOn(Date.prototype, 'toLocaleDateString').and.callThrough();
    formatReportDate('2026-09-07');
    expect(formatter).toHaveBeenCalledWith('en-US', jasmine.objectContaining({ timeZone: 'UTC' }));
  });

  it('preserves every today queue entry, clinic context and account-wide notifications', () => {
    const queue = Array.from({ length: 8 }, (_, index) => ({ ...input.queue[0], patient: `Patient ${index}` }));
    const reportInput = { ...input, clinic: 'All clinics', queue, metrics: { ...input.metrics, queueCount: 8 } };
    expect(table("Today's Appointment Queue", reportInput).rows.length).toBe(8);
    expect(table("Today's Appointment Queue", reportInput).rows[7]).toEqual(['09:00', 'Patient 7', 'Cleaning, Checkup', 'Legarda Clinic']);
    expect(table("Today's Appointment Queue", reportInput).scope).toContain('Sep 8, 2026; confirmed appointments');
    expect(table('Recent Notifications (account-wide)', reportInput).rows[0]).toEqual(['Status Update', 'Notice', 'Sep 8', 'Unread']);
    expect(table('Recent Notifications (account-wide)', reportInput).scope).toContain('independent of selected clinic');
  });

  it('keeps empty distributions and seven zero days without inventing completed appointments', () => {
    const empty = { ...input, services: { labels: [], datasets: [{ data: [] }] },
      appointments: { ...input.appointments, datasets: [{ data: Array(7).fill(0) }, { data: Array(7).fill(0) }] } };
    expect(table('Preferred Services Distribution', empty).rows).toEqual([]);
    expect(table('Weekly Appointment Trend', empty).rows.length).toBe(7);
    expect(table('Weekly Appointment Trend', empty).rows.every(row => row[2] === '0' && row[3] === '0')).toBeTrue();
  });
});
