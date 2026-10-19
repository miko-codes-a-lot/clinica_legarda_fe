import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { AnalyticsReportState, ReportSelection, shiftReportAnchor } from '../model/analytics-report';
import { analyticsFixture } from '../model/analytics-report.fixtures';
import { AnalyticsService } from './analytics-service';

describe('Period-qualified report loading', () => {
  let service: AnalyticsService, http: HttpTestingController;
  const selection = (period: 'week'|'month'|'year' = 'week', clinicId = 'all'): ReportSelection => ({ clinicId, query: { period, anchor: '2026-10-20' } });
  beforeEach(() => { TestBed.configureTestingModule({ providers:[provideHttpClient(),provideHttpClientTesting()] }); service=TestBed.inject(AnalyticsService);http=TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('uses one snapshot request with the selected period and excludes operational data', () => {
    let actual: unknown; service.getReport('clinic-a',{period:'month',anchor:'2026-10-20'}).subscribe(value=>actual=value);
    const request=http.expectOne(r=>r.url==='/analytics/report/clinic-a');
    expect(request.request.params.get('period')).toBe('month');expect(request.request.params.get('anchor')).toBe('2026-10-20');
    const report={...analyticsFixture(selection('month').query),clinicId:'clinic-a'};request.flush(report);
    expect(actual).toEqual(report); http.expectNone(r=>r.url.includes('/queue/'));
  });
  it('cancels old clinic and period requests and disables the previous snapshot immediately', () => {
    const choices=new BehaviorSubject(selection()),states:AnalyticsReportState[]=[];
    const sub=service.watchReports(choices).subscribe(state=>states.push(state));
    const old=http.expectOne(r=>r.url==='/analytics/report/all');choices.next(selection('month'));
    expect(old.cancelled).toBeTrue();const month=http.expectOne(r=>r.url==='/analytics/report/all');choices.next(selection('year','clinic-b'));
    expect(month.cancelled).toBeTrue();expect(states.at(-1)?.status).toBe('loading');
    http.expectOne(r=>r.url==='/analytics/report/clinic-b').flush({...analyticsFixture(selection('year').query),clinicId:'clinic-b'});
    expect(states.filter(state=>state.status==='ready').map(state=>state.clinicId)).toEqual(['clinic-b']);sub.unsubscribe();
  });
  it('rejects a mismatched snapshot and allows retrying the same selection', () => {
    const choices=new BehaviorSubject(selection('month')),states:AnalyticsReportState[]=[];
    const sub=service.watchReports(choices).subscribe(state=>states.push(state));
    http.expectOne(r=>r.url==='/analytics/report/all').flush(analyticsFixture());expect(states.at(-1)?.status).toBe('error');
    choices.next(selection('month'));http.expectOne(r=>r.url==='/analytics/report/all').flush(analyticsFixture(selection('month').query));
    expect(states.at(-1)?.status).toBe('ready');sub.unsubscribe();
  });
  it('moves by week, calendar month and year without rolling over long or leap-day dates', () => {
    expect(shiftReportAnchor({period:'week',anchor:'2026-12-31'},1)).toBe('2027-01-07');
    expect(shiftReportAnchor({period:'month',anchor:'2026-03-31'},-1)).toBe('2026-02-01');
    expect(shiftReportAnchor({period:'year',anchor:'2028-02-29'},-1)).toBe('2027-01-01');
  });
});
