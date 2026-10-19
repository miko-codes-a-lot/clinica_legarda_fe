import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { AnalyticsQueueEntry, AnalyticsReport, AnalyticsReportState, ReportQuery, ReportSelection } from '../model/analytics-report';
import { clinicToday } from '../../care/care.models';
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private readonly http: HttpClient) {}
  getReport(clinicId: string, query: ReportQuery = { period: 'week', anchor: clinicToday() }): Observable<AnalyticsReport> {
    const params = new HttpParams().set('period',query.period).set('anchor',query.anchor);
    return this.http.get<AnalyticsReport>(`/analytics/report/${encodeURIComponent(clinicId)}`, { params }).pipe(map(report => {
      if (report.clinicId !== clinicId || report.period.kind !== query.period || report.period.anchor !== query.anchor)
        throw new Error('The report does not match the current selection.');
      return report;
    }));
  }
  getQueue(clinicId: string) { return this.http.get<AnalyticsQueueEntry[]>(`/analytics/queue/${encodeURIComponent(clinicId)}`); }
  watchReports(selections: Observable<ReportSelection>): Observable<AnalyticsReportState> {
    return selections.pipe(switchMap(({clinicId,query}) => this.getReport(clinicId,query).pipe(
      map((report): AnalyticsReportState => ({status:'ready',clinicId,report})),
      catchError(() => of<AnalyticsReportState>({status:'error',clinicId})),
      startWith<AnalyticsReportState>({status:'loading',clinicId}),
    )));
  }
}
