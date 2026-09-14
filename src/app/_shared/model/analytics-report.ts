export interface AnalyticsSummary {
  weekOf: string;
  weekEnd: string;
  today: string;
  totalAppointments: number;
  appointmentsUpdated: number;
  preferredServices: Record<string, number>;
  declinedReferrals: Record<string, number>;
}

export interface AnalyticsTrend {
  weekOf: string;
  weekEnd: string;
  labels: string[];
  appointments: number[];
  completed: number[];
  serviceTrend: Record<string, number[]>;
}

export interface AnalyticsQueueEntry {
  appointmentId: string;
  time: string;
  patientName: string;
  service: string;
  clinicId: string;
  clinicName: string;
}

export interface AnalyticsReport {
  clinicId: string;
  summary: AnalyticsSummary;
  trend: AnalyticsTrend;
  queue: AnalyticsQueueEntry[];
}

export type AnalyticsReportState =
  | { status: 'loading'; clinicId: string }
  | { status: 'error'; clinicId: string }
  | { status: 'ready'; clinicId: string; report: AnalyticsReport };

/** API date keys describe calendar days, not instants in the browser's zone. */
export function formatReportDate(key: string): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}
