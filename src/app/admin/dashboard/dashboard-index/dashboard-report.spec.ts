import { createDashboardPdf, DashboardReport } from './dashboard-report';

function reportWithRows(rows: readonly (readonly string[])[]): DashboardReport {
  return {
    clinic: 'Legarda Clinic', week: 'Sep 7, 2026 - Sep 13, 2026',
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
