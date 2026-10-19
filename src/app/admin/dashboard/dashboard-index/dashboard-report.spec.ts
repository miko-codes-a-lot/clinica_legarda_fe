import { analyticsFixture } from '../../../_shared/model/analytics-report.fixtures';
import { createDashboardReport, renderDashboardReport, createDashboardPdf, DashboardReport } from './dashboard-report';

function reportWithRows(rows: readonly (readonly string[])[]): DashboardReport {
  return {
    clinic: 'Legarda Clinic', period: 'Sep 7, 2026 - Sep 13, 2026',
    tables: [{
      title: 'Service Trend per Day', scope: 'Legarda Clinic; Sep 7, 2026 - Sep 13, 2026',
      headers: ['Date', 'Service', 'Appointments'], columnWidths: [0.3, 0.5, 0.2], rows,
    }],
  };
}

describe('Dashboard table PDF', () => {
  it('paginates long tables, retaining the final values and repeating headers', () => {
    const rows = Array.from({ length: 150 }, (_, index) => ['Sep 7, 2026', `Service ${index}`, String(index)]);
    const pdf = createDashboardPdf(reportWithRows(rows));
    const output = pdf.output();

    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
    expect(output).toContain('(Service 149)');
    expect(output).toContain('(149)');
    expect(output.match(/\(Appointments\)/g)?.length).toBe(pdf.getNumberOfPages());
    expect(output).toContain(`(Page ${pdf.getNumberOfPages()} of ${pdf.getNumberOfPages()})`);
    expect(output).not.toContain('/Subtype /Image');
  });

  it('includes a readable empty state instead of inventing graph values', () => {
    const pdf = createDashboardPdf(reportWithRows([]));

    expect(pdf.getNumberOfPages()).toBe(1);
    expect(pdf.output()).toContain('(No data available.)');
    expect(pdf.output()).toContain('Legarda Clinic');
    expect(pdf.output()).toContain('Sep 7, 2026 - Sep 13, 2026');
  });
});


describe('Filtered analytics table report', () => {
  for (const period of ['week','month','year'] as const) {
    it(`exports the selected ${period} snapshot without queue or notifications`, () => {
      const snapshot=analyticsFixture({period,anchor:'2026-10-20'});snapshot.totalAppointments=4;snapshot.preferredServices={Cleaning:4};
      const report=createDashboardReport({title:'Clinic Report',clinic:'Test clinic',report:snapshot});
      const doc=document.implementation.createHTMLDocument();renderDashboardReport(doc,report);
      expect(doc.body.textContent).toContain('Oct 20, 2026');
      expect(doc.body.textContent).toContain('Total Appointments4');
      expect(doc.body.textContent).toContain('Patient record');
      expect(doc.body.textContent).not.toMatch(/Notifications|Queue|Appointments updated/);
      expect(report.tables.find(table=>table.title==='Appointment Trend')?.rows).toHaveSize(snapshot.period.bucketKeys.length);
    });
  }
});
