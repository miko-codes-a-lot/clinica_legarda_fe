import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
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

  notifications$!: Observable<Notification[]>;
  unreadNotificationsCount$!: Observable<number>;

  /** 🔹 Separate all appointments vs filtered ones */
  allAppointments: Appointment[] = [];
  appointmentData: Appointment[] = [];

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
    private router: Router
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
}
