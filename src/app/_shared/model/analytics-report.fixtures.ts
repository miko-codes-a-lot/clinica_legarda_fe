import { AnalyticsReport, ReportQuery } from './analytics-report';
export function analyticsFixture(query: ReportQuery = { period: 'week', anchor: '2026-10-20' }): AnalyticsReport {
  const date = new Date(query.anchor), year = date.getUTCFullYear(), month = date.getUTCMonth();
  const start = query.period === 'week' ? new Date(date.getTime() - ((date.getUTCDay()+6)%7)*86400000) : new Date(Date.UTC(year, query.period === 'year' ? 0 : month, 1));
  const until = query.period === 'week' ? new Date(start.getTime()+7*86400000) : new Date(Date.UTC(query.period === 'year' ? year+1 : year, query.period === 'year' ? 0 : month+1, 1));
  const bucketKeys = query.period === 'year' ? Array.from({length:12},(_,m)=>`${year}-${String(m+1).padStart(2,'0')}`) : Array.from({length:(until.getTime()-start.getTime())/86400000},(_,d)=>new Date(start.getTime()+d*86400000).toISOString().slice(0,10));
  const empty = () => Array<number>(bucketKeys.length).fill(0);
  return { clinicId: 'all', generatedAt: '2026-10-20T00:00:00Z', period: { kind: query.period, anchor: query.anchor, start: start.toISOString().slice(0,10), end: new Date(until.getTime()-86400000).toISOString().slice(0,10), bucketKeys, labels: bucketKeys },
    totalAppointments: 0, uniquePatients: 0, statuses: { pending:0, confirmed:0, cancelled:0, rejected:0, completed:0, no_show:0 },
    completed:0, noShow:0, completedShare:0, noShowRate:0, preferredServices:{}, trend:{appointments:empty(),completed:empty(),noShow:empty(),serviceTrend:{}},
    patientRecordChanges:{events:0,patients:0,counts:empty(),coverageFrom:'2026-10-20T00:00:00Z'},
    metricDefinitions:{completedShare:'Completed / all appointments.',noShowRate:'No-show rate among resolved outcomes: No-show / (completed + No-show).',patientRecordChanges:'Actual record changes since activation; no historical backfill.'} };
}
