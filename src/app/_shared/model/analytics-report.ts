export type ReportPeriodKind = 'week' | 'month' | 'year';
export interface ReportQuery { period: ReportPeriodKind; anchor: string; }
export interface ReportSelection { clinicId: string; query: ReportQuery; }
export interface AnalyticsReport {
  clinicId: string; generatedAt: string;
  period: { kind: ReportPeriodKind; anchor: string; start: string; end: string; bucketKeys: string[]; labels: string[] };
  totalAppointments: number; uniquePatients: number; statuses: Record<string, number>;
  completed: number; noShow: number; completedShare: number; noShowRate: number;
  preferredServices: Record<string, number>;
  trend: { appointments: number[]; completed: number[]; noShow: number[]; serviceTrend: Record<string, number[]> };
  patientRecordChanges: { events: number; patients: number; counts: number[]; coverageFrom: string };
  metricDefinitions: { completedShare: string; noShowRate: string; patientRecordChanges: string };
}
export interface AnalyticsQueueEntry {
  appointmentId: string;
  time: string;
  patientName: string;
  service: string;
  clinicId: string;
  clinicName: string;
}

export type AnalyticsReportState =
  | { status: 'loading'; clinicId: string }
  | { status: 'error'; clinicId: string }
  | { status: 'ready'; clinicId: string; report: AnalyticsReport };

export function shiftReportAnchor(query: ReportQuery, offset: number): string {
  const date = new Date(query.anchor);
  if (query.period === 'week') date.setUTCDate(date.getUTCDate() + 7 * offset);
  else if (query.period === 'month') date.setUTCFullYear(date.getUTCFullYear(), date.getUTCMonth() + offset, 1);
  else date.setUTCFullYear(date.getUTCFullYear() + offset, 0, 1);
  return date.toISOString().slice(0,10);
}
export function formatReportBucket(key: string): string {
  return key.length === 7 ? new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-US', { month:'short', year:'numeric', timeZone:'UTC' }) : formatReportDate(key);
}
/** API date keys describe calendar days, not instants in the browser's zone. */
export function formatReportDate(key: string): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}
