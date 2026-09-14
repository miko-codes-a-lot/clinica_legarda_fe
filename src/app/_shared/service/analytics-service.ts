import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, startWith, switchMap } from 'rxjs';
import { AnalyticsQueueEntry, AnalyticsReport, AnalyticsReportState, AnalyticsSummary, AnalyticsTrend } from '../model/analytics-report';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private readonly http: HttpClient) {}

  getReport(clinicId: string): Observable<AnalyticsReport> {
    const scope = encodeURIComponent(clinicId);
    return forkJoin({
      summary: this.http.get<AnalyticsSummary>(`/analytics/summary/${scope}`),
      trend: this.http.get<AnalyticsTrend>(`/analytics/trend/${scope}`),
      queue: this.http.get<AnalyticsQueueEntry[]>(`/analytics/queue/${scope}`),
    }).pipe(map(report => {
      // Requests straddling the Manila week boundary must not form one export.
      if (report.summary.weekOf !== report.trend.weekOf || report.summary.weekEnd !== report.trend.weekEnd) {
        throw new Error('Report periods changed; reload the report.');
      }
      return { ...report, clinicId };
    }));
  }

  watchReports(clinics: Observable<string>): Observable<AnalyticsReportState> {
    return clinics.pipe(switchMap(clinicId => this.getReport(clinicId).pipe(
      map((report): AnalyticsReportState => ({ status: 'ready', clinicId, report })),
      catchError(() => of<AnalyticsReportState>({ status: 'error', clinicId })),
      startWith<AnalyticsReportState>({ status: 'loading', clinicId }),
    )));
  }
}
