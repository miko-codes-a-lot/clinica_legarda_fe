import jsPDF, { CellConfig } from 'jspdf';
import { AnalyticsReport, formatReportDate, formatReportBucket } from '../../../_shared/model/analytics-report';
export interface DashboardReportTable { readonly title: string; readonly scope: string; readonly headers: readonly string[]; readonly rows: readonly (readonly string[])[]; readonly columnWidths: readonly number[]; }
export interface DashboardReport { readonly title?: string; readonly clinic: string; readonly period: string; readonly generatedAt?: string; readonly tables: readonly DashboardReportTable[]; }
export interface DashboardReportInput { readonly title: string; readonly clinic: string; readonly report: AnalyticsReport; }
export function createDashboardReport(input: DashboardReportInput): DashboardReport {
  const report=input.report, period=`${formatReportDate(report.period.start)} - ${formatReportDate(report.period.end)}`;
  const scope=`${input.clinic}; ${period}; ${report.period.kind}`;
  const bucket=(index:number)=>formatReportBucket(report.period.bucketKeys[index]);
  const percent=(value:number)=>`${(value*100).toFixed(1)}%`;
  const services=Object.entries(report.preferredServices), serviceTotal=services.reduce((sum,[,count])=>sum+count,0);
  const coverage=new Date(report.patientRecordChanges.coverageFrom).toLocaleString('en-US',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'});
  return {title:input.title,clinic:input.clinic,period,generatedAt:report.generatedAt,tables:[
    {title:'Dashboard Metrics',scope,headers:['Metric','Value','Meaning'],columnWidths:[.32,.14,.54],rows:[
      ['Total Appointments',String(report.totalAppointments),'All statuses in the selected period.'],
      ['Unique patients',String(report.uniquePatients),'Distinct patient records with appointments in this period.'],
      ['Completed appointments',String(report.completed),'Completed appointments in this period.'],
      ['No-show appointments',String(report.noShow),'No-show appointments in this period.'],
      ['Completed share',percent(report.completedShare),report.metricDefinitions.completedShare],
      ['No-show rate',percent(report.noShowRate),report.metricDefinitions.noShowRate],
      ['Patients with record changes',String(report.patientRecordChanges.patients),'Distinct patients with recorded changes in this period.'],
      ['Patient record change events',String(report.patientRecordChanges.events),report.metricDefinitions.patientRecordChanges],
    ]},
    {title:'Appointment Statuses',scope,headers:['Status','Appointments'],columnWidths:[.65,.35],rows:Object.entries(report.statuses).map(([status,count])=>[status==='no_show'?'No-show':status[0].toUpperCase()+status.slice(1),String(count)])},
    {title:'Preferred Services Distribution',scope:`${scope}; distinct services per appointment`,headers:['Service','Appointments','Share of selections'],columnWidths:[.5,.22,.28],rows:services.map(([name,count])=>[name,String(count),percent(serviceTotal?count/serviceTotal:0)])},
    {title:'Appointment Trend',scope,headers:[report.period.kind==='year'?'Month':'Date','Total','Completed','No-show'],columnWidths:[.34,.22,.22,.22],rows:report.period.bucketKeys.map((_,index)=>[bucket(index),String(report.trend.appointments[index]??0),String(report.trend.completed[index]??0),String(report.trend.noShow[index]??0)])},
    {title:'Service Trend',scope,headers:[report.period.kind==='year'?'Month':'Date','Service','Appointments'],columnWidths:[.25,.5,.25],rows:report.period.bucketKeys.flatMap((_,index)=>Object.entries(report.trend.serviceTrend).map(([name,counts])=>[bucket(index),name,String(counts[index]??0)]))},
    {title:'Patient record changes',scope:`${scope}. Audit coverage starts ${coverage} (Philippine time). ${report.metricDefinitions.patientRecordChanges}`,headers:[report.period.kind==='year'?'Month':'Date','Recorded changes'],columnWidths:[.55,.45],rows:report.period.bucketKeys.map((_,index)=>[bucket(index),String(report.patientRecordChanges.counts[index]??0)])},
  ]};
}

/** Uses textContent so clinic, service, and patient names remain literal text. */
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
  appendText(document.body, 'p', `Selected clinic: ${report.clinic} | Period: ${report.period}`);
  if (report.generatedAt) appendText(document.body, 'p', `Generated: ${new Date(report.generatedAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (Philippine time)`);
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
    pdf.setFont('helvetica', 'bold').setFontSize(17);
    const title: string[] = pdf.splitTextToSize(report.title ?? 'Staff Dashboard Report', width);
    pdf.setFont('helvetica', 'normal').setFontSize(10);
    const generated = report.generatedAt ? ` | Generated: ${new Date(report.generatedAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (Manila)` : '';
    const context: string[] = pdf.splitTextToSize(`Selected clinic: ${report.clinic} | Period: ${report.period}${generated}`, width);
    const scope: string[] = pdf.splitTextToSize(table.scope, width);
    pdf.setFont('helvetica', 'bold').setFontSize(13);
    const tableTitle: string[] = pdf.splitTextToSize(table.title, width);
    const contextY = margin + title.length * 19.55;
    const tableTitleY = contextY + context.length * 11.5 + 16;
    const scopeY = tableTitleY + tableTitle.length * 14.95 + 10;
    const tableTop = scopeY + scope.length * 11.5 + 8;
    pdf.setHeaderFunction(() => {
      pdf.setFont('helvetica', 'bold').setFontSize(17);
      pdf.text(title, margin, margin);
      pdf.setFont('helvetica', 'normal').setFontSize(10);
      pdf.text(context, margin, contextY);
      pdf.setFont('helvetica', 'bold').setFontSize(13);
      pdf.text(tableTitle, margin, tableTitleY);
      pdf.setFont('helvetica', 'normal').setFontSize(10);
      pdf.text(scope, margin, scopeY);
      return [margin, tableTop, 0, 0];
    });
    const sourceRows = table.rows.length ? table.rows : [table.headers.map((_, column) => column === 0 ? 'No data available.' : '')];
    // A clinical paragraph can exceed a page. Split logical rows into bounded
    // continued rows before handing them to jsPDF's non-splitting table plugin.
    const linesPerRow = Math.max(1, Math.min(18, Math.floor((pdf.internal.pageSize.getHeight() - margin - tableTop - 55) / 11.5)));
    pdf.setFont('helvetica', 'normal').setFontSize(10);
    const rows = sourceRows.flatMap(row => {
      const cells = row.map((value, column) => pdf.splitTextToSize(value, width * table.columnWidths[column] - 12) as string[]);
      const chunks = Math.max(1, ...cells.map(lines => Math.ceil(lines.length / linesPerRow)));
      return Array.from({ length: chunks }, (_, chunk) => cells.map((lines, column) => {
        const text = lines.slice(chunk * linesPerRow, (chunk + 1) * linesPerRow).join('\n');
        return text || (column === 0 && chunk > 0 ? `${row[0]} (continued)` : '');
      }));
    });
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
