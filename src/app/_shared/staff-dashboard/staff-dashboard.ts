import { DOCUMENT } from '@angular/common';
import { ThemeService } from '../service/theme-service';
import { applyChartTheme, readChartTheme } from './chart-theme';
import { PageHeader } from '../ui/page-header/page-header';
import { EmptyState } from '../ui/empty-state/empty-state';
import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, DestroyRef, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Icon } from '../ui/icon/icon';
import { GenericTableComponent } from '../component/table/generic-table.component';
import { TableCellDirective } from '../component/table/table-cell.directive';
import { TableColumn } from '../component/table/table-model';
import { NOTIFICATION_COLUMNS, NOTIFICATION_FILTERS, notificationDay, notificationLink, notificationTimestamp, notificationTypeLabel } from '../component/table/notification-table-config';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';

import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BehaviorSubject, catchError, finalize, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalyticsService } from '../service/analytics-service';
import { AnalyticsReportState, AnalyticsQueueEntry, formatReportDate, ReportPeriodKind, ReportQuery, ReportSelection, shiftReportAnchor } from '../model/analytics-report';
import { clinicToday } from '../../care/care.models';
import { NotificationService } from '../service/notification-service';
import { ClinicService } from '../service/clinic-service';
import { Notification, NotificationType } from '../model/notification';
import { Router, RouterLink } from '@angular/router';


import { Clinic } from '../model/clinic';
import { createDashboardPdf, createDashboardReport, DashboardReport, renderDashboardReport } from '../../admin/dashboard/dashboard-index/dashboard-report';

Chart.register(...registerables);

@Component({
  selector: 'app-staff-dashboard',
  imports: [PageHeader, EmptyState,
    CommonModule,
    MatCardModule,
    Icon,
    MatBadgeModule,
    GenericTableComponent, TableCellDirective, RouterLink,
    MatChipsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    ReactiveFormsModule
  ],
  templateUrl: './staff-dashboard.html',
  styleUrls: ['./staff-dashboard.css']
})
export class StaffDashboard {
  @ViewChild('servicesChart', { static: false }) servicesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('appointmentTrendChart', { static: false }) appointmentTrendRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('serviceTrendChart', { static: false }) serviceTrendChartRef!: ElementRef<HTMLCanvasElement>;

  serviceTrendChart!: Chart<'bar', number[], string>;
  notifications$!: Observable<Notification[]>;
  unreadNotificationsCount$!: Observable<number>;

  @Input() area: 'admin' | 'super-admin' = 'admin';
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);
  private chartTheme = readChartTheme(this.document);
  period: ReportPeriodKind = 'week';
  anchor = clinicToday();
  private readonly clinicSelection = new BehaviorSubject('all');
  private readonly reportSelection = new BehaviorSubject<ReportSelection>({ clinicId: 'all', query: this.query });
  operationalQueue: AnalyticsQueueEntry[] = [];
  queueLoading = false; queueError = '';
  private viewReady = false;
  state: AnalyticsReportState = { status: 'loading', clinicId: 'all' };
  clinics: Pick<Clinic, '_id' | 'name'>[] = [];
  clinicsLoading = false;
  private clinicsLoaded = false;
  selectedClinic = 'all';
  isExporting = false;
  reportError = '';
  clinicError = '';
  notificationError = '';
  private latestNotifications: Notification[] = [];

  servicesChart!: Chart<'doughnut', number[], string>;
  appointmentTrendChart!: Chart<'line', number[], string>;
  showNotifications = false;
  displayedColumns = ['time', 'patientName', 'service', 'clinicName'];
  readonly notificationColumns = ['type', 'message', 'createdAt', 'status', 'actions'];
  readonly notificationDefs = NOTIFICATION_COLUMNS;
  readonly notificationFilters = NOTIFICATION_FILTERS;
  readonly notificationDay = notificationDay;
  readonly queueColumns: readonly TableColumn<AnalyticsQueueEntry>[] = [
    { key: 'time', label: 'Time', cell: row => row.time },
    { key: 'patientName', label: 'Patient', cell: row => row.patientName },
    { key: 'service', label: 'Services', cell: row => row.service },
    { key: 'clinicName', label: 'Clinic', cell: row => row.clinicName },
  ];
  readonly pendingReads = new Set<string>();
  @ViewChild('notificationTrigger', { read: ElementRef }) notificationTrigger?: ElementRef<HTMLButtonElement>;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly analyticsService: AnalyticsService,
    private readonly clinicService: ClinicService,
    private readonly router: Router,
  ) {}

  get title(): string { return this.area === 'super-admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'; }
  get allClinicsLabel(): string { return this.area === 'admin' ? 'All assigned clinics' : 'All clinics'; }
  get hasNoAssignedClinics(): boolean { return this.area === 'admin' && this.clinicsLoaded && this.clinics.length === 1; }
  get notificationScope(): string { return this.area === 'admin' ? 'Assigned-clinic notifications' : 'Account-wide notifications'; }
  get report() {
    return this.clinicsLoaded && !this.hasNoAssignedClinics && this.state.status === 'ready'
      ? this.state.report : undefined;
  }
  get query(): ReportQuery { return { period: this.period, anchor: this.anchor }; }
  get appointmentQueue() { return this.clinicsLoaded && !this.hasNoAssignedClinics ? this.operationalQueue : []; }
  get periodLabel(): string { const period = this.report?.period; return period ? `${formatReportDate(period.start)} – ${formatReportDate(period.end)} (Manila)` : ''; }
  get todayLabel(): string { return formatReportDate(clinicToday()); }
  get periodTitle(): string { return this.period[0].toUpperCase() + this.period.slice(1); }
  get statusEntries() { return Object.entries(this.report?.statuses ?? {}).map(([status,count]) => ({ label: status === 'no_show' ? 'No-show' : status[0].toUpperCase() + status.slice(1), count })); }
  private emitReport() { this.reportSelection.next({ clinicId: this.selectedClinic, query: this.query }); }
  onPeriodChange(value: string) { if (!['week','month','year'].includes(value)) return; this.period = value as ReportPeriodKind; this.emitReport(); }
  onAnchorChange(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2100-12-31') return; this.anchor = value; this.emitReport(); }
  movePeriod(offset: number) { this.onAnchorChange(shiftReportAnchor(this.query, offset)); }
  currentPeriod() { this.anchor = clinicToday(); this.emitReport(); }

  ngOnInit(): void {
    this.themeService.themeChanges$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.chartTheme = readChartTheme(this.document);
      this.refreshChartTheme();
    });
    this.loadClinics();
    this.analyticsService.watchReports(this.reportSelection).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      this.state = state;
      this.reportError = state.status === 'error' ? 'Report unavailable. Please retry.' : '';
      this.updateCharts();
    });
    this.clinicSelection.pipe(switchMap(clinic => {
      this.queueLoading = true; this.operationalQueue = []; this.queueError = '';
      return this.analyticsService.getQueue(clinic).pipe(catchError(() => { this.queueError = 'Today’s queue could not be loaded.'; return of([]); }), finalize(() => this.queueLoading = false));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(rows => this.operationalQueue = rows);
    this.notifications$ = this.notificationService.notifications$.pipe(
      map(items => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)),
      tap(items => this.latestNotifications = items),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.unreadNotificationsCount$ = this.notificationService.notifications$.pipe(map(items => items.filter(item => !item.read).length));
    // Keep read actions current while the notification dropdown is closed.
    this.notifications$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.notificationService.getAllNotifications().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => this.notificationError = `${this.notificationScope} could not be refreshed.`,
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.updateCharts();
  }

  loadClinics(): void {
    this.clinicError = '';
    this.clinicsLoading = true;
    this.clinicsLoaded = false;
    this.clinics = [];
    this.clinicService.getAccessible().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: clinics => {
        this.clinics = [{ _id: 'all', name: this.allClinicsLabel }, ...clinics];
        this.clinicsLoaded = true;
        if (this.selectedClinic !== 'all' && !clinics.some(clinic => clinic._id === this.selectedClinic)) {
          this.selectedClinic = 'all';
        }
        this.clinicSelection.next(this.selectedClinic);
        this.emitReport();
      },
      error: () => this.clinicError = 'Clinic choices could not be loaded. Retry to check your current clinic access.',
    }).add(() => this.clinicsLoading = false);
  }

  onClinicChange(clinicId: string): void {
    this.selectedClinic = clinicId;
    this.clinicSelection.next(clinicId);
    this.emitReport();
  }

  retryReport(): void { this.emitReport(); }
  retryQueue(): void { this.clinicSelection.next(this.selectedClinic); }

  private updateCharts(): void {
    if (!this.viewReady) return;
    this.createOrUpdateServicesChart();
    this.createAppointmentTrendChart();
    this.createServiceTrendChart();
    this.refreshChartTheme();
  }

  private refreshChartTheme(): void {
    if (!this.viewReady) return;
    // Recolor existing dataset objects so legend visibility survives a theme change.
    if (this.servicesChart) {
      this.servicesChart.data.datasets[0].backgroundColor = this.chartTheme.colors.slice(0, 4);
      this.servicesChart.data.datasets[0].borderColor = this.chartTheme.surface;
    }
    this.appointmentTrendChart?.data.datasets.forEach((dataset, index) => {
      dataset.borderColor = this.chartTheme.colors[index];
      dataset.backgroundColor = this.chartTheme.fills[index];
    });
    this.serviceTrendChart?.data.datasets.forEach((dataset, index) => {
      dataset.backgroundColor = this.chartTheme.colors[index % this.chartTheme.colors.length];
    });
    for (const chart of [this.servicesChart, this.appointmentTrendChart, this.serviceTrendChart]) {
      if (!chart) continue;
      applyChartTheme(chart, this.chartTheme);
      chart.update('none');
    }
  }

  // ----------------- SERVICES CHART -----------------
  private createOrUpdateServicesChart(): void {
    const services = Object.keys((this.report?.preferredServices ?? {}));
    const counts = Object.values((this.report?.preferredServices ?? {}));

    if (this.servicesChart) {
      this.servicesChart.data.labels = services;
      this.servicesChart.data.datasets[0].data = counts;
      return;
    }

    const config: ChartConfiguration<'doughnut', number[], string> = {
      type: 'doughnut',
      data: {
        labels: services,
        datasets: [{
          data: counts,
          backgroundColor: this.chartTheme.colors.slice(0, 4),
          borderWidth: 2,
          borderColor: this.chartTheme.surface
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.servicesChart = new Chart(this.servicesChartRef.nativeElement, config);
  }

  // ----------------- APPOINTMENT TREND -----------------
  private getPeriodTrendData(): { labels: string[], scheduled: number[], completed: number[], noShow: number[] } {
    return {
      labels: this.report?.period.labels ?? [],
      scheduled: this.report?.trend.appointments ?? [],
      completed: this.report?.trend.completed ?? [],
      noShow: this.report?.trend.noShow ?? [],
    };
  }

  private createAppointmentTrendChart(): void {
    const trendData = this.getPeriodTrendData();

    if (this.appointmentTrendChart) {
      this.appointmentTrendChart.data.labels = trendData.labels;
      this.appointmentTrendChart.data.datasets[0].data = trendData.scheduled;
      this.appointmentTrendChart.data.datasets[1].data = trendData.completed;
      this.appointmentTrendChart.data.datasets[2].data = trendData.noShow;
      return;
    }

    const config: ChartConfiguration<'line', number[], string> = {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [
          {
            label: 'Total Appointments',
            data: trendData.scheduled,
            borderColor: this.chartTheme.colors[0],
            backgroundColor: this.chartTheme.fills[0],
            tension: 0.4,
            fill: true
          },
          {
            label: 'Completed Appointments',
            data: trendData.completed,
            borderColor: this.chartTheme.colors[1],
            backgroundColor: this.chartTheme.fills[1],
            tension: 0.4,
            fill: true
          },
          { label: 'No-show', data: trendData.noShow, borderColor: this.chartTheme.colors[2], backgroundColor: this.chartTheme.fills[2], tension: .2, fill: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    };

    this.appointmentTrendChart = new Chart(this.appointmentTrendRef.nativeElement, config);
  }

  // ----------------- HELPERS -----------------
  formatTimestamp = notificationTimestamp;
  formatNotificationType = notificationTypeLabel;

  markAsRead(notificationId: string): void {
    if (this.pendingReads.has(notificationId) || this.latestNotifications.find(item => item._id === notificationId)?.read) return;
    this.pendingReads.add(notificationId);
    this.notificationService.markAsRead(notificationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => this.notificationError = 'This notification could not be marked as read. Please try again.',
    }).add(() => this.pendingReads.delete(notificationId));
  }

  toggleNotifications(): void { this.showNotifications = !this.showNotifications; }
  closeNotifications(): void {
    this.showNotifications = false;
    this.notificationTrigger?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    if (this.servicesChart) this.servicesChart.destroy();
    if (this.appointmentTrendChart) this.appointmentTrendChart.destroy();
    if (this.serviceTrendChart) this.serviceTrendChart.destroy();
  }

  redirectToDetails(link: string | undefined) {
    const route = notificationLink(link, this.area);
    if (route) void this.router.navigateByUrl(route);
  }

  private createServiceTrendChart(): void {
    const trendData = this.getServiceTrendData();

    if (this.serviceTrendChart) {
      this.serviceTrendChart.data.labels = trendData.labels;
      this.serviceTrendChart.data.datasets = trendData.datasets;
      return;
    }

    const config: ChartConfiguration<'bar', number[], string> = {
      type: 'bar',
      data: {
        labels: trendData.labels,
        datasets: trendData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y}`
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: {
            beginAtZero: true,
            stacked: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    };

    this.serviceTrendChart = new Chart(this.serviceTrendChartRef.nativeElement, config);
  }

  private getServiceTrendData(): { labels: string[], datasets: { label: string, data: number[], backgroundColor: string }[] } {
    const colors = this.chartTheme.colors;
    return {
      labels: this.report?.period.labels ?? [],
      datasets: Object.entries(this.report?.trend.serviceTrend ?? {}).map(([label, data], index) => ({
        label, data, backgroundColor: colors[index % colors.length],
      })),
    };
  }

  get canExport(): boolean {
    return this.clinicsLoaded && !this.clinicsLoading && !this.clinicError && !this.hasNoAssignedClinics
      && this.state.status === 'ready' && this.state.clinicId === this.selectedClinic
      && this.state.report.period.kind === this.period && this.state.report.period.anchor === this.anchor;
  }

  private dashboardReport(): DashboardReport {
    const report = this.report;
    if (!report || report.clinicId !== this.selectedClinic) throw new Error('Report unavailable');
    return createDashboardReport({ title: `${this.title} Report`,
      clinic: this.clinics.find(clinic => clinic._id === report.clinicId)?.name ?? report.clinicId, report });
  }

  printTables(): void {
    if (!this.canExport) return;
    this.reportError = '';
    const printWindow = window.open('', '_blank', 'popup');
    if (!printWindow) {
      this.reportError = 'Allow pop-ups to print the graph tables, or use Export PDF.';
      return;
    }
    printWindow.opener = null;
    renderDashboardReport(printWindow.document, this.dashboardReport());
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  exportToPDF(): void {
    if (!this.canExport || this.isExporting) return;
    this.isExporting = true;
    this.reportError = '';
    try {
      createDashboardPdf(this.dashboardReport()).save(`${this.area}-dashboard-${Date.now()}.pdf`);
    } catch {
      this.reportError = 'Unable to export the graph tables. Please try again.';
    } finally {
      this.isExporting = false;
    }
  }
}
