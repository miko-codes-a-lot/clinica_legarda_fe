import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
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
    MatButtonModule
  ],
  templateUrl: './dashboard-index.html',
  styleUrl: './dashboard-index.css'
})
export class DashboardIndex {
  @ViewChild('servicesChart', { static: false }) servicesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('appointmentTrendChart', { static: false }) appointmentTrendRef!: ElementRef<HTMLCanvasElement>;

  // Dashboard data
  dashboardData = {
    adminDashboard: {
      weeklyReport: {
        weekOf: '2025-08-04',
        totalAppointments: 55,
        patientRecordsChanged: 12,
        preferredServices: {
          'Dental Cleaning': 25,
          'Pasta (Filling)': 15,
          'Tooth Extraction': 10,
          'Braces Consultation': 5
        }
      },
      dailyAppointmentQueue: [
        {time: '09:00', patientName: 'Maria Dela Cruz', service: 'Pasta (Filling)'},
        {time: '10:00', patientName: 'Ivan Christian Abuyog', service: 'Dental Cleaning'},
        {time: '11:00', patientName: 'Juan Santos', service: 'Tooth Extraction'}
      ],
      notifications: [
        {
          notificationId: 'N001',
          type: 'New Booking',
          message: 'Patient John Benedict Baguyo booked a new appointment.',
          timestamp: '2025-08-02T11:00:00Z',
          isRead: false
        },
        {
          notificationId: 'N002',
          type: 'Cancellation',
          message: 'Patient Ana Gomez cancelled her appointment for Aug 12.',
          timestamp: '2025-08-01T18:00:00Z',
          isRead: true
        }
      ]
    }
  };

  // Chart instances
  servicesChart!: Chart;
  appointmentTrendChart!: Chart;

  // UI State
  showNotifications = false;

  // Computed properties
  get weeklyReport() {
    return this.dashboardData.adminDashboard.weeklyReport;
  }

  get appointmentQueue() {
    return this.dashboardData.adminDashboard.dailyAppointmentQueue;
  }

  get notifications() {
    return this.dashboardData.adminDashboard.notifications;
  }

  get unreadNotificationsCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }

  displayedColumns: string[] = ['time', 'patientName', 'service'];
  notificationColumns: string[] = ['type', 'message', 'timestamp', 'status'];

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    this.createServicesChart();
    this.createAppointmentTrendChart();
  }

  private createServicesChart(): void {
    const services = this.weeklyReport.preferredServices;
    const labels = Object.keys(services);
    const data = Object.values(services);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#3f51b5', // Primary
            '#ff4081', // Accent
            '#4caf50', // Success
            '#ff9800'  // Warning
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
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

  private createAppointmentTrendChart(): void {
    // Mock data for demonstration - in real app, this would come from API
    const mockWeeklyData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      appointments: [8, 12, 10, 15, 9, 6, 5],
      completed: [7, 11, 9, 13, 8, 5, 4]
    };

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: mockWeeklyData.labels,
        datasets: [
          {
            label: 'Scheduled Appointments',
            data: mockWeeklyData.appointments,
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Completed Appointments',
            data: mockWeeklyData.completed,
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
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.appointmentTrendChart = new Chart(this.appointmentTrendRef.nativeElement, config);
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.notificationId === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  ngOnDestroy(): void {
    if (this.servicesChart) {
      this.servicesChart.destroy();
    }
    if (this.appointmentTrendChart) {
      this.appointmentTrendChart.destroy();
    }
  }
}
