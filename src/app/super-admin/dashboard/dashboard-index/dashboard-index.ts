import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { map, Observable } from 'rxjs';
import { NotificationService } from '../../../_shared/service/notification-service';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { Notification, NotificationType } from '../../../_shared/model/notification';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { Router } from '@angular/router';
import { Reason } from '../../../_shared/model/reason';
import { ReasonService } from '../../../_shared/service/reason-service';

import { Referral } from '../../../_shared/model/referral';
import { ReferralService } from '../../../_shared/service/referral-service';


Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-index',
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
  providers: [DatePipe],
  templateUrl: './dashboard-index.html',
  styleUrls: ['./dashboard-index.css']
})
export class DashboardIndex {
  @ViewChild('servicesChart', { static: false }) servicesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('appointmentTrendChart', { static: false }) appointmentTrendRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('serviceTrendChart', { static: false }) serviceTrendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('declinedReferralChart', { static: false }) declinedReferralChartRef!: ElementRef<HTMLCanvasElement>;

  serviceTrendChart!: Chart;
  notifications$!: Observable<Notification[]>;
  unreadNotificationsCount$!: Observable<number>;
  declinedReferralChart!: Chart;

  /** 🔹 Separate all appointments vs filtered ones */
  allAppointments: Appointment[] = [];
  appointmentData: Appointment[] = [];

  reasons: Reason[] = [];
  referrals: Referral[] = [];

  clinics: any[] = [];
  selectedClinic: string = '';

  dashboardData = {
    adminDashboard: {
      weeklyReport: {
        weekOf: '',
        totalAppointments: 0,
        patientRecordsChanged: 0,
        preferredServices: {} as Record<string, number>
      },
      dailyAppointmentQueue: [],
      notifications: []
    }
  };

  servicesChart!: Chart;
  appointmentTrendChart!: Chart;

  showNotifications = false;
  displayedColumns: string[] = ['time', 'patientName', 'service'];
  notificationColumns: string[] = ['type', 'message', 'timestamp', 'status'];

  constructor(
    private notificationService: NotificationService,
    private appointmentService: AppointmentService,
    private clinicService: ClinicService,
    private datePipe: DatePipe,
    private router: Router,
    private readonly reasonService: ReasonService,
    private readonly referralService: ReferralService
  ) {}

  get weeklyReport() {
    return this.dashboardData.adminDashboard.weeklyReport;
  }

  get appointmentQueue() {
    return this.getTodaysQueue();
  }

  get notifications() {
    return this.dashboardData.adminDashboard.notifications;
  }

  // ----------------- INIT -----------------
  ngOnInit(): void {
    this.reasonService.getAll().subscribe(r => this.reasons = r);
    this.referralService.getAll().subscribe(r => {
      this.referrals = r;
      // safe to create chart after data is ready and view is initialized
      if (this.declinedReferralChartRef) {
        this.createOrUpdateDeclinedReferralChart();
      }
    });
    this.loadClinics();
    this.loadAppointmentData();

    this.notifications$ = this.notificationService.notifications$.pipe(
      map(n => n.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10))
    );
    this.unreadNotificationsCount$ = this.notifications$.pipe(map(n => n.filter(x => !x.read).length));

    this.notificationService.getAllNotifications().subscribe({
      error: (err) => console.error('Failed to fetch initial notifications', err)
    });
  }


  // ----------------- LOAD DATA -----------------
  private loadAppointmentData(): void {
    this.appointmentService.getAll().subscribe({
      next: (data: Appointment[]) => {
        this.allAppointments = data;
        this.applyClinicFilter(); // 🔹 filter data after loading
      },
      error: (err) => console.error(err)
    });
  }

  loadClinics() {
    this.clinicService.getAll().subscribe({
      next: (data) => {
      this.clinics = [{ _id: 'all', name: 'All Clinics' }, ...data];
      this.selectedClinic = 'all'; // default selection
      },
      error: (err) => console.error('Error loading clinics:', err),
    });
  }

  // ----------------- CLINIC CHANGE HANDLER -----------------
  onClinicChange(clinicId: string) {
    this.selectedClinic = clinicId;
    this.applyClinicFilter(); // 🔹 reload filtered metrics and charts
  }

  // ----------------- APPLY CLINIC FILTER -----------------
  applyClinicFilter(): void {
    if (this.selectedClinic && this.selectedClinic !== 'all') {
      this.appointmentData = this.allAppointments.filter(a => a.clinic?._id === this.selectedClinic);
    } else {
      this.appointmentData = [...this.allAppointments];
    }

    this.updateDashboardMetrics();
    this.createOrUpdateServicesChart();
    this.createAppointmentTrendChart();
    this.createServiceTrendChart();
  }

  // ----------------- METRICS CALCULATION -----------------
  updateDashboardMetrics(): void {
    const startOfWeek = this.getStartOfWeek();
    const confirmedAppointments = this.appointmentData.filter(a => a.status === 'confirmed');
    const updatedWeekly = this.appointmentData.filter(a => {
      const dateStr = a.updatedAt || a.createdAt;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= startOfWeek;
    });

    const preferredServices: Record<string, number> = {};
    confirmedAppointments.forEach(a => {
      a.services.forEach(s => {
        preferredServices[s.name] = (preferredServices[s.name] || 0) + 1;
      });
    });

    this.dashboardData.adminDashboard.weeklyReport = {
      weekOf: startOfWeek.toISOString().split('T')[0],
      totalAppointments: confirmedAppointments.length,
      patientRecordsChanged: updatedWeekly.length,
      preferredServices
    };
  }

  // ----------------- SERVICES CHART -----------------
  private createOrUpdateServicesChart(): void {
    const services = Object.keys(this.weeklyReport.preferredServices);
    const counts = Object.values(this.weeklyReport.preferredServices);

    if (this.servicesChart) {
      this.servicesChart.data.labels = services;
      this.servicesChart.data.datasets[0].data = counts;
      this.servicesChart.update();
      return;
    }

    const config: ChartConfiguration = {
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
    const startOfWeek = this.getStartOfWeek();
    const labels: string[] = [];
    const scheduled: number[] = [];
    const completed: number[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);

      // 🔹 Filipino weekday labels
      const dayStr = day.toLocaleDateString('fil-PH', { weekday: 'short' });
      labels.push(dayStr);

      const dayAppointments = this.appointmentData.filter(a => {
        const appointmentDate = new Date(a.date);
        return (
          appointmentDate.getFullYear() === day.getFullYear() &&
          appointmentDate.getMonth() === day.getMonth() &&
          appointmentDate.getDate() === day.getDate()
        );
      });

      scheduled.push(dayAppointments.length);
      completed.push(dayAppointments.filter(a => a.status === 'confirmed').length);
    }

    return { labels, scheduled, completed };
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

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [
          {
            label: 'Scheduled Appointments',
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
  getStartOfWeek(): Date {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - diffToMonday);
    return startOfWeek;
  }

  getTodaysQueue(): Appointment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return this.appointmentData.filter(a => {
      const appointmentDate = new Date(a.date);
      return appointmentDate >= today && appointmentDate < tomorrow && a.status === 'confirmed';
    });
  }

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
    this.notificationService.markAsRead(notificationId).subscribe({
      error: (err) => console.error(`Failed to mark notification ${notificationId} as read`, err)
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  ngOnDestroy(): void {
    if (this.servicesChart) this.servicesChart.destroy();
    if (this.appointmentTrendChart) this.appointmentTrendChart.destroy();
  }

  redirectToDetails(link: string | undefined) {
    if (link) this.router.navigate([link]);
  }

  private createServiceTrendChart(): void {
    const trendData = this.getServiceTrendData();

    if (this.serviceTrendChart) {
      this.serviceTrendChart.data.labels = trendData.labels;
      this.serviceTrendChart.data.datasets = trendData.datasets;
      this.serviceTrendChart.update();
      return;
    }

    const config: ChartConfiguration = {
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
    const startOfWeek = this.getStartOfWeek();
    const labels: string[] = [];
    const dayAppointments: Appointment[][] = [[], [], [], [], [], [], []]; // 7 days

    // Initialize weekday labels
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      labels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));

      // Filter appointments per day
      dayAppointments[i] = this.appointmentData.filter(a => {
        const date = new Date(a.date);
        return date.getFullYear() === day.getFullYear()
          && date.getMonth() === day.getMonth()
          && date.getDate() === day.getDate();
      });
    }

    // Collect all unique services
    const allServicesSet = new Set<string>();
    this.appointmentData.forEach(a => a.services.forEach(s => allServicesSet.add(s.name)));
    const allServices = Array.from(allServicesSet);

    // Build datasets per service
    const datasets = allServices.map((serviceName, idx) => {
      const data = dayAppointments.map(dayApps => 
        dayApps.filter(a => a.services.some(s => s.name === serviceName)).length
      );
      const colors = ['#3f51b5', '#ff4081', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#ffc107'];
      return {
        label: serviceName,
        data,
        backgroundColor: colors[idx % colors.length]
      };
    });

    return { labels, datasets };
  }

  private getDeclinedReferralData(): { labels: string[], counts: number[] } {
    // Filter only rejected referrals
    const declined = this.referrals.filter(r => r.status === 'rejected');

    const reasonCounts: Record<string, number> = {};
    declined.forEach(r => {
      const reason = r.reasonOfDecline || 'Unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    // Map reason codes to labels if available
    const labels = Object.keys(reasonCounts).map(code => {
      const reasonObj = this.reasons?.find(r => r.code === code);
      return reasonObj ? reasonObj.label : code;
    });

    const counts = Object.values(reasonCounts);

    return { labels, counts };
  }

  private createOrUpdateDeclinedReferralChart(): void {
    const { labels, counts } = this.getDeclinedReferralData();
    console.log('this.declinedReferralChart', this.declinedReferralChart);
    if (this.declinedReferralChart) {
      this.declinedReferralChart.data.labels = labels;
      this.declinedReferralChart.data.datasets[0].data = counts;
      this.declinedReferralChart.update();
      return;
    }

    const config: ChartConfiguration = {
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

}
