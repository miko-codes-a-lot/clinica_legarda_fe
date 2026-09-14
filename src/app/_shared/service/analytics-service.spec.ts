import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { AnalyticsReportState, AnalyticsSummary, AnalyticsTrend } from '../model/analytics-report';
import { AnalyticsService } from './analytics-service';

const summary: AnalyticsSummary = {
  weekOf: '2026-09-07', weekEnd: '2026-09-13', today: '2026-09-08',
  totalAppointments: 3, appointmentsUpdated: 2, preferredServices: { Cleaning: 3 }, declinedReferrals: { unavailable: 1 },
};
const trend: AnalyticsTrend = {
  weekOf: summary.weekOf, weekEnd: summary.weekEnd,
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  appointments: [2, 1, 0, 0, 0, 0, 0], completed: [1, 0, 0, 0, 0, 0, 0], serviceTrend: { Cleaning: [2, 1, 0, 0, 0, 0, 0] },
};

describe('Analytics report scope loading', () => {
  let service: AnalyticsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AnalyticsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function finish(clinicId: string) {
    http.expectOne(`/analytics/summary/${clinicId}`).flush(summary);
    http.expectOne(`/analytics/trend/${clinicId}`).flush(trend);
    http.expectOne(`/analytics/queue/${clinicId}`).flush([]);
  }

  it('publishes one consistent report only after all three scoped responses arrive', () => {
    const states: AnalyticsReportState[] = [];
    const subscription = service.watchReports(new BehaviorSubject('all')).subscribe(state => states.push(state));
    expect(states).toEqual([{ status: 'loading', clinicId: 'all' }]);
    http.expectOne('/analytics/summary/all').flush(summary);
    http.expectOne('/analytics/trend/all').flush(trend);
    expect(states.length).toBe(1);
    const queue = Array.from({ length: 8 }, (_, index) => ({ appointmentId: String(index), time: '09:00', patientName: 'Patient', service: 'Cleaning, Checkup', clinicId: 'clinic-a', clinicName: 'Legarda' }));
    http.expectOne('/analytics/queue/all').flush(queue);
    expect(states[1]).toEqual({ status: 'ready', clinicId: 'all', report: { clinicId: 'all', summary, trend, queue } });
    subscription.unsubscribe();
  });

  it('cancels old clinic requests and clears ready values immediately on selection', () => {
    const scopes = new BehaviorSubject('all');
    const states: AnalyticsReportState[] = [];
    const subscription = service.watchReports(scopes).subscribe(state => states.push(state));
    finish('all');
    scopes.next('clinic-a');
    expect(states[states.length - 1]).toEqual({ status: 'loading', clinicId: 'clinic-a' });
    const stale = http.match(request => request.url.endsWith('/clinic-a'));
    scopes.next('clinic-b');
    expect(stale.length).toBe(3);
    expect(stale.every(request => request.cancelled)).toBeTrue();
    finish('clinic-b');
    expect(states.filter(state => state.status === 'ready').map(state => state.clinicId)).toEqual(['all', 'clinic-b']);
    subscription.unsubscribe();
  });

  it('marks a partial failure unavailable and allows retrying the same scope', () => {
    const scopes = new BehaviorSubject('all');
    const states: AnalyticsReportState[] = [];
    const subscription = service.watchReports(scopes).subscribe(state => states.push(state));
    const pending = http.match(request => request.url.endsWith('/all'));
    pending[0].flush({}, { status: 503, statusText: 'Unavailable' });
    expect(states[1]).toEqual({ status: 'error', clinicId: 'all' });
    expect(pending.slice(1).every(request => request.cancelled)).toBeTrue();
    scopes.next('all');
    finish('all');
    expect(states[states.length - 1].status).toBe('ready');
    subscription.unsubscribe();
  });

  it('rejects different report weeks if requests cross the Manila week boundary', () => {
    const states: AnalyticsReportState[] = [];
    const subscription = service.watchReports(new BehaviorSubject('all')).subscribe(state => states.push(state));
    http.expectOne('/analytics/summary/all').flush(summary);
    http.expectOne('/analytics/trend/all').flush({ ...trend, weekOf: '2026-09-14', weekEnd: '2026-09-20' });
    http.expectOne('/analytics/queue/all').flush([]);
    expect(states[1]).toEqual({ status: 'error', clinicId: 'all' });
    subscription.unsubscribe();
  });
});
