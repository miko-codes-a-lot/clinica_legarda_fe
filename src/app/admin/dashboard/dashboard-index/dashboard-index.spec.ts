import { createDashboardReport, DashboardReportInput, renderDashboardReport } from './dashboard-report';
import { formatReportDate } from '../../../_shared/model/analytics-report';
import { analyticsFixture } from '../../../_shared/model/analytics-report.fixtures';
const snapshot=analyticsFixture({period:'week',anchor:'2026-09-07'});
snapshot.totalAppointments=3;snapshot.completed=1;snapshot.completedShare=1/3;snapshot.uniquePatients=2;
snapshot.preferredServices={'Cleaning <routine>':3};snapshot.trend.appointments=[2,1,0,0,0,0,0];snapshot.trend.completed=[1,0,0,0,0,0,0];snapshot.trend.serviceTrend={'Cleaning <routine>':[2,1,0,0,0,0,0]};
snapshot.patientRecordChanges.events=4;snapshot.patientRecordChanges.patients=2;
const input:DashboardReportInput={title:'Admin Dashboard Report',clinic:'Test Clinic',report:snapshot};
function table(title:string,reportInput=input) { const table=createDashboardReport(reportInput).tables.find(item=>item.title===title);if(!table)throw new Error(title);return table; }
describe('Staff report values and scope',()=>{
  it('preserves authoritative totals, actual outcomes and patient record changes',()=>{
    expect(table('Dashboard Metrics').rows).toContain(jasmine.arrayContaining(['Total Appointments','3']));
    expect(table('Dashboard Metrics').rows).toContain(jasmine.arrayContaining(['Patient record change events','4']));
    expect(table('Appointment Trend').rows[0]).toEqual(['Sep 7, 2026','2','1','0']);
    expect(table('Preferred Services Distribution').rows).toEqual([['Cleaning <routine>','3','100.0%']]);
    expect(table('Service Trend').rows[1]).toEqual(['Sep 8, 2026','Cleaning <routine>','1']);
  });
  it('uses the same clinic and complete period for every table',()=>{
    const report=createDashboardReport(input);expect(report.period).toBe('Sep 7, 2026 - Sep 13, 2026');
    expect(report.tables.every(table=>table.scope.includes('Test Clinic; Sep 7, 2026 - Sep 13, 2026'))).toBeTrue();
  });
  it('formats calendar keys without browser timezone shifts',()=>{
    expect(formatReportDate('2026-09-07')).toBe('Sep 7, 2026');expect(table('Appointment Trend').rows[6][0]).toBe('Sep 13, 2026');
  });
  it('omits operational data and renders untrusted service names as literal text',()=>{
    const report=createDashboardReport(input),doc=document.implementation.createHTMLDocument();renderDashboardReport(doc,report);
    expect(doc.body.textContent).not.toMatch(/Queue|Notifications|Appointments updated/);
    expect(doc.body.textContent).toContain('Cleaning <routine>');expect(doc.querySelector('routine')).toBeNull();
  });
  it('retains zero-filled periods and truthful empty distributions',()=>{
    const empty={...input,report:analyticsFixture({period:'week',anchor:'2026-09-07'})};
    expect(table('Preferred Services Distribution',empty).rows).toEqual([]);
    expect(table('Appointment Trend',empty).rows).toHaveSize(7);
    expect(table('Appointment Trend',empty).rows.every(row=>row.slice(1).every(value=>value==='0'))).toBeTrue();
  });
});
