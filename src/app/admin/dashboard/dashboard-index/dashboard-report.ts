import jsPDF, { CellConfig } from 'jspdf';
import { formatReportDate } from '../../../_shared/model/analytics-report';

interface GraphData {
  readonly labels?: readonly string[];
  readonly datasets: readonly { readonly label?: string; readonly data: readonly number[] }[];
}

export interface DashboardReportTable {
  readonly title: string;
  readonly scope: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly columnWidths: readonly number[];
}

export interface DashboardReport {
  readonly title?: string;
  readonly clinic: string;
  readonly week: string;
  readonly tables: readonly DashboardReportTable[];
}

export interface DashboardReportInput {
  readonly title: string;
  readonly clinic: string;
  readonly weekOf: string;
  readonly weekEnd: string;
  readonly services: GraphData;
  readonly appointments: GraphData;
  readonly serviceTrend: GraphData;
  readonly declinedReferrals: GraphData;
  readonly today: string;
  readonly metrics: { readonly totalAppointments: number; readonly appointmentsUpdated: number; readonly queueCount: number };
  readonly queue: readonly { readonly time: string; readonly patient: string; readonly services: string; readonly clinic: string }[];
  readonly notifications: readonly { readonly type: string; readonly message: string; readonly timestamp: string; readonly status: string }[];
}

function distributionRows(graph: GraphData): string[][] {
  const counts = graph.datasets[0]?.data ?? [];
  const total = counts.reduce((sum, count) => sum + count, 0);
  return (graph.labels ?? []).map((label, index) => {
    const count = counts[index] ?? 0;
    return [label, String(count), `${(total ? count / total * 100 : 0).toFixed(1)}%`];
  });
}

export function createDashboardReport(input: DashboardReportInput): DashboardReport {
  const dateAt = (index: number): string => {
    const date = new Date(`${input.weekOf}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return formatReportDate(date.toISOString().slice(0, 10));
  };
  const week = `${formatReportDate(input.weekOf)} - ${formatReportDate(input.weekEnd)}`;
  const weeklyScope = `${input.clinic}; ${week}`;
  return {
    title: input.title,
    clinic: input.clinic,
    week,
    tables: [
      {
        title: 'Dashboard Metrics',
        scope: input.clinic,
        headers: ['Metric', 'Value', 'Period'],
        rows: [
          ['Total Appointments', String(input.metrics.totalAppointments), `${week}; all statuses`],
          ['Appointments updated', String(input.metrics.appointmentsUpdated), `${week}; updated in Manila time`],
          ["Today's Queue", String(input.metrics.queueCount), formatReportDate(input.today)],
        ],
        columnWidths: [0.38, 0.12, 0.5],
      },
      {
        title: 'Preferred Services Distribution',
        scope: `${weeklyScope}; all statuses`,
        headers: ['Service', 'Appointments', 'Share'],
        rows: distributionRows(input.services),
        columnWidths: [0.6, 0.2, 0.2],
      },
      {
        title: 'Weekly Appointment Trend',
        scope: weeklyScope,
        headers: ['Date', 'Day', 'Total Appointments', 'Completed Appointments'],
        rows: (input.appointments.labels ?? []).map((label, index) => [
          dateAt(index), label, ...input.appointments.datasets.map(dataset => String(dataset.data[index] ?? 0)),
        ]),
        columnWidths: [0.28, 0.12, 0.3, 0.3],
      },
      {
        title: 'Service Trend per Day',
        scope: weeklyScope,
        headers: ['Date', 'Day', 'Service', 'Appointments'],
        rows: (input.serviceTrend.labels ?? []).flatMap((label, index) =>
          input.serviceTrend.datasets.map(dataset => [
            dateAt(index), label, dataset.label ?? '', String(dataset.data[index] ?? 0),
          ])),
        columnWidths: [0.25, 0.1, 0.45, 0.2],
      },
      {
        title: 'Declined Referrals by Reason',
        scope: `${weeklyScope}; receiving appointment; rejected referrals`,
        headers: ['Reason', 'Declined Referrals', 'Share'],
        rows: distributionRows(input.declinedReferrals),
        columnWidths: [0.6, 0.2, 0.2],
      },
      {
        title: "Today's Appointment Queue",
        scope: `${input.clinic}; ${formatReportDate(input.today)}; confirmed appointments`,
        headers: ['Time', 'Patient Name', 'Service', 'Clinic'],
        rows: input.queue.map(row => [row.time, row.patient, row.services, row.clinic]),
        columnWidths: [0.12, 0.28, 0.35, 0.25],
      },
      {
        title: 'Recent Notifications (account-wide)',
        scope: 'Latest 10 notifications for this account; independent of selected clinic',
        headers: ['Type', 'Message', 'Date', 'Status'],
        rows: input.notifications.map(row => [row.type, row.message, row.timestamp, row.status]),
        columnWidths: [0.17, 0.45, 0.25, 0.13],
      },
    ],
  };
}

/** Uses textContent so clinic, service, and reason names remain literal text. */
export function renderDashboardReport(document: Document, report: DashboardReport): void {
  document.title = report.title ?? 'Staff Dashboard Report';
  document.body.replaceChildren();
  const style = document.createElement('style');
  style.textContent = `
    @page { size: A4; margin: 15mm; }
    body { color: #172033; font: 12px/1.5 Arial, sans-serif; margin: 24px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin: 24px 0 4px; break-after: avoid; }
    p { margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 8px; border: 1px solid #9aa2ae; text-align: left; overflow-wrap: anywhere; }
    th { background: #edf0f5; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    @media print { body { margin: 0; } }
  `;
  document.head.append(style);
  const appendText = (parent: HTMLElement, tag: string, text: string): HTMLElement => {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.append(element);
    return element;
  };
  appendText(document.body, 'h1', report.title ?? 'Staff Dashboard Report');
  appendText(document.body, 'p', `Selected clinic: ${report.clinic} | Week: ${report.week}`);
  for (const data of report.tables) {
    const section = document.createElement('section');
    document.body.append(section);
    appendText(section, 'h2', data.title);
    appendText(section, 'p', data.scope);
    const table = document.createElement('table');
    table.setAttribute('aria-label', data.title);
    section.append(table);
    const columns = document.createElement('colgroup');
    data.columnWidths.forEach(width => {
      const column = document.createElement('col');
      column.style.width = `${width * 100}%`;
      columns.append(column);
    });
    table.append(columns);
    const header = table.createTHead().insertRow();
    data.headers.forEach(label => appendText(header, 'th', label).setAttribute('scope', 'col'));
    const body = table.createTBody();
    if (!data.rows.length) {
      const cell = body.insertRow().insertCell();
      cell.colSpan = data.headers.length;
      cell.textContent = 'No data available.';
    }
    data.rows.forEach(values => {
      const row = body.insertRow();
      values.forEach(value => { row.insertCell().textContent = value; });
    });
  }
}

export function createDashboardPdf(report: DashboardReport): jsPDF {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 36;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  pdf.setProperties({ title: report.title ?? 'Staff Dashboard Report' });
  report.tables.forEach((table, index) => {
    if (index > 0) pdf.addPage();
    pdf.setFontSize(10);
    const context: string[] = pdf.splitTextToSize(`Selected clinic: ${report.clinic} | Week: ${report.week}`, width);
    const scope: string[] = pdf.splitTextToSize(table.scope, width);
    const tableTop = 80 + (context.length + scope.length) * 12;
    pdf.setHeaderFunction(() => {
      pdf.setFont('helvetica', 'bold').setFontSize(17);
      pdf.text(report.title ?? 'Staff Dashboard Report', margin, margin);
      pdf.setFont('helvetica', 'normal').setFontSize(10);
      pdf.text(context, margin, 54);
      pdf.setFont('helvetica', 'bold').setFontSize(13);
      pdf.text(table.title, margin, 70 + context.length * 12);
      pdf.setFont('helvetica', 'normal').setFontSize(10);
      pdf.text(scope, margin, 86 + context.length * 12);
      return [margin, tableTop, 0, 0];
    });
    const rows = table.rows.length ? table.rows : [table.headers.map((_, column) => column === 0 ? 'No data available.' : '')];
    pdf.table(margin, tableTop, rows.map(row => Object.fromEntries(row.map((value, column) => [String(column), value]))),
      table.headers.map((header, column): CellConfig => ({
        name: String(column), prompt: header, align: 'left', padding: 6,
        // jsPDF's built-in table accepts column widths in CSS pixels.
        width: width * table.columnWidths[column] / 0.75,
      })), {
        autoSize: false, printHeaders: true, fontSize: 10, padding: 6,
        margins: { top: tableTop, bottom: margin, left: margin, width },
        headerBackgroundColor: '#edf0f5', headerTextColor: '#172033',
      });
  });
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page).setFont('helvetica', 'normal').setFontSize(9);
    pdf.text(`Page ${page} of ${pageCount}`, pdf.internal.pageSize.getWidth() - margin, pdf.internal.pageSize.getHeight() - 18, { align: 'right' });
  }
  return pdf;
}
