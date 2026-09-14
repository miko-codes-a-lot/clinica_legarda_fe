import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, DestroyRef, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';

import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BehaviorSubject, map, Observable, shareReplay, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalyticsService } from '../service/analytics-service';
import { AnalyticsReportState, formatReportDate } from '../model/analytics-report';
import { NotificationService } from '../service/notification-service';
import { ClinicService } from '../service/clinic-service';
import { Notification, NotificationType } from '../model/notification';
import { Router } from '@angular/router';
import { Reason } from '../model/reason';
import { ReasonService } from '../service/reason-service';


import { Clinic } from '../model/clinic';
import { createDashboardPdf, createDashboardReport, DashboardReport, renderDashboardReport } from '../../admin/dashboard/dashboard-index/dashboard-report';

Chart.register(...registerables);

@Component({
  selector: 'app-staff-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatBadgeModule,
    MatTableModule,
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
  @ViewChild('declinedReferralChart', { static: false }) declinedReferralChartRef!: ElementRef<HTMLCanvasElement>;

  serviceTrendChart!: Chart<'bar', number[], string>;
  notifications$!: Observable<Notification[]>;
  unreadNotificationsCount$!: Observable<number>;
  declinedReferralChart!: Chart<'doughnut', number[], string>;

  @Input() area: 'admin' | 'super-admin' = 'admin';
  private readonly destroyRef = inject(DestroyRef);
  private readonly clinicSelection = new BehaviorSubject('all');
  private viewReady = false;
  state: AnalyticsReportState = { status: 'loading', clinicId: 'all' };
  reasons: Reason[] = [];
  clinics: Pick<Clinic, '_id' | 'name'>[] = [{ _id: 'all', name: 'All clinics' }];
  selectedClinic = 'all';
  isExporting = false;
  reportError = '';
  clinicError = '';
  notificationError = '';
  private reportNotifications: Notification[] = [];

  servicesChart!: Chart<'doughnut', number[], string>;
  appointmentTrendChart!: Chart<'line', number[], string>;
  showNotifications = false;
  displayedColumns = ['time', 'patientName', 'service', 'clinicName'];
  notificationColumns = ['type', 'message', 'timestamp', 'status'];

  constructor(
    private readonly notificationService: NotificationService,
    private readonly analyticsService: AnalyticsService,
    private readonly clinicService: ClinicService,
    private readonly router: Router,
    private readonly reasonService: ReasonService,
  ) {}

  get title(): string { return this.area === 'super-admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'; }
  get report() { return this.state.status === 'ready' ? this.state.report : undefined; }
  get weeklyReport() { return this.report?.summary; }
  get appointmentQueue() { return this.report?.queue ?? []; }
  get weekLabel(): string {
    const summary = this.weeklyReport;
    return summary ? `${formatReportDate(summary.weekOf)} – ${formatReportDate(summary.weekEnd)} (Manila)` : '';
  }
  get todayLabel(): string { return this.weeklyReport ? formatReportDate(this.weeklyReport.today) : ''; }

  ngOnInit(): void {
    this.reasonService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: reasons => { this.reasons = reasons; this.updateCharts(); },
      error: () => { /* Raw reason codes remain usable if the label directory fails. */ },
    });
    this.loadClinics();
    this.analyticsService.watchReports(this.clinicSelection).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      this.state = state;
      this.reportError = state.status === 'error' ? 'Report unavailable. Please retry.' : '';
      this.updateCharts();
    });
    this.notifications$ = this.notificationService.notifications$.pipe(
      map(items => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)),
      tap(items => this.reportNotifications = items),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.unreadNotificationsCount$ = this.notificationService.notifications$.pipe(map(items => items.filter(item => !item.read).length));
    // Keep export notifications current independently of the dropdown's visibility.
    this.notifications$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.notificationService.getAllNotifications().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => this.notificationError = 'Account-wide notifications could not be refreshed.',
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.updateCharts();
  }

  loadClinics(): void {
    this.clinicError = '';
    this.clinicService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: clinics => this.clinics = [{ _id: 'all', name: 'All clinics' }, ...clinics],
      error: () => this.clinicError = 'Clinic choices could not be loaded. All clinics remains available.',
    });
  }

  onClinicChange(clinicId: string): void {
    this.selectedClinic = clinicId;
    this.clinicSelection.next(clinicId);
  }

  retryReport(): void { this.clinicSelection.next(this.selectedClinic); }

  private updateCharts(): void {
    if (!this.viewReady) return;
    this.createOrUpdateServicesChart();
    this.createAppointmentTrendChart();
    this.createServiceTrendChart();
    this.createOrUpdateDeclinedReferralChart();
  }

  // ----------------- SERVICES CHART -----------------
  private createOrUpdateServicesChart(): void {
    const services = Object.keys((this.weeklyReport?.preferredServices ?? {}));
    const counts = Object.values((this.weeklyReport?.preferredServices ?? {}));

    if (this.servicesChart) {
      this.servicesChart.data.labels = services;
      this.servicesChart.data.datasets[0].data = counts;
      this.servicesChart.update();
      return;
    }

    const config: ChartConfiguration<'doughnut', number[], string> = {
      type: 'doughnut',
      data: {
        labels: services,
        datasets: [{
          data: counts,
          backgroundColor: ['#3f51b5', '#ff4081', '#4caf50', '#ff9800'],
          borderWidth: 2,
          borderColor: '#ffffff'
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

  // ----------------- WEEKLY APPOINTMENT TREND -----------------
  private getWeeklyTrendData(): { labels: string[], scheduled: number[], completed: number[] } {
    return {
      labels: this.report?.trend.labels ?? [],
      scheduled: this.report?.trend.appointments ?? [],
      completed: this.report?.trend.completed ?? [],
    };
  }

  private createAppointmentTrendChart(): void {
    const trendData = this.getWeeklyTrendData();

    if (this.appointmentTrendChart) {
      this.appointmentTrendChart.data.labels = trendData.labels;
      this.appointmentTrendChart.data.datasets[0].data = trendData.scheduled;
      this.appointmentTrendChart.data.datasets[1].data = trendData.completed;
      this.appointmentTrendChart.update();
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
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Completed Appointments',
            data: trendData.completed,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true
          }
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
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatNotificationType(type: NotificationType): string {
    switch (type) {
      case NotificationType.APPOINTMENT_CREATED: return 'New Booking';
      case NotificationType.APPOINTMENT_STATUS_UPDATED: return 'Status Update';
      case NotificationType.APPOINTMENT_REMINDER: return 'Reminder';
      default: return 'Notification';
    }
  }

  getNotificationTypeClass(type: NotificationType): string {
    return type === NotificationType.APPOINTMENT_CREATED ? 'booking' : 'cancellation';
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (err) => console.error(`Failed to mark notification ${notificationId} as read`, err)
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  ngOnDestroy(): void {
    if (this.servicesChart) this.servicesChart.destroy();
    if (this.appointmentTrendChart) this.appointmentTrendChart.destroy();
    if (this.serviceTrendChart) this.serviceTrendChart.destroy();
    if (this.declinedReferralChart) this.declinedReferralChart.destroy();
  }

  redirectToDetails(link: string | undefined) {
    if (link) this.router.navigate([link.replace(/^\/(?:admin|super-admin)(?=\/)/, `/${this.area}`)]);
  }

  private createServiceTrendChart(): void {
    const trendData = this.getServiceTrendData();

    if (this.serviceTrendChart) {
      this.serviceTrendChart.data.labels = trendData.labels;
      this.serviceTrendChart.data.datasets = trendData.datasets;
      this.serviceTrendChart.update();
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
    const colors = ['#3f51b5', '#ff4081', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#ffc107'];
    return {
      labels: this.report?.trend.labels ?? [],
      datasets: Object.entries(this.report?.trend.serviceTrend ?? {}).map(([label, data], index) => ({
        label, data, backgroundColor: colors[index % colors.length],
      })),
    };
  }

  private getDeclinedReferralData(): { labels: string[], counts: number[] } {
    const counts = this.weeklyReport?.declinedReferrals ?? {};
    return {
      labels: Object.keys(counts).map(code => this.reasons.find(reason => reason.code === code)?.label ?? code),
      counts: Object.values(counts),
    };
  }

  private createOrUpdateDeclinedReferralChart(): void {
    const { labels, counts } = this.getDeclinedReferralData();
    if (this.declinedReferralChart) {
      this.declinedReferralChart.data.labels = labels;
      this.declinedReferralChart.data.datasets[0].data = counts;
      this.declinedReferralChart.update();
      return;
    }

    const config: ChartConfiguration<'doughnut', number[], string> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: ['#f44336', '#ff9800', '#9c27b0', '#3f51b5', '#4caf50'],
          borderWidth: 2,
          borderColor: '#fff'
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

    this.declinedReferralChart = new Chart(this.declinedReferralChartRef.nativeElement, config);
  }
  get canExport(): boolean {
    return this.state.status === 'ready' && this.state.clinicId === this.selectedClinic;
  }

  private dashboardReport(): DashboardReport {
    const report = this.report;
    if (!report || report.clinicId !== this.selectedClinic) throw new Error('Report unavailable');
    const declined = this.getDeclinedReferralData();
    return createDashboardReport({
      title: `${this.title} Report`,
      clinic: this.clinics.find(clinic => clinic._id === report.clinicId)?.name ?? report.clinicId,
      weekOf: report.summary.weekOf,
      weekEnd: report.summary.weekEnd,
      today: report.summary.today,
      services: { labels: Object.keys(report.summary.preferredServices), datasets: [{ data: Object.values(report.summary.preferredServices) }] },
      appointments: { labels: report.trend.labels, datasets: [{ data: report.trend.appointments }, { data: report.trend.completed }] },
      serviceTrend: { labels: report.trend.labels, datasets: Object.entries(report.trend.serviceTrend).map(([label, data]) => ({ label, data })) },
      declinedReferrals: { labels: declined.labels, datasets: [{ data: declined.counts }] },
      metrics: {
        totalAppointments: report.summary.totalAppointments,
        appointmentsUpdated: report.summary.appointmentsUpdated,
        queueCount: report.queue.length,
      },
      queue: report.queue.map(appointment => ({
        time: appointment.time,
        patient: appointment.patientName,
        services: appointment.service,
        clinic: appointment.clinicName,
      })),
      notifications: this.reportNotifications.map(notification => ({
        type: this.formatNotificationType(notification.type),
        message: notification.message,
        timestamp: this.formatTimestamp(notification.createdAt),
        status: notification.read ? 'Read' : 'Unread',
      })),
    });
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
