import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';

interface WeeklySummaryResponse {
  weekOf: string; // ISO date string
  totalAppointments: number;
  patientRecordsChanged: number;
  preferredServices: { [serviceName: string]: number };
}

interface WeeklyTrendResponse {
  labels: string[];
  appointments: number[];
  completed: number[];
}

interface DailyQueueResponse {
  time: string;
  patientName: string;
  service: string;
}

// combined for Dashboard state
export interface DashboardData {
  weeklyReport: WeeklySummaryResponse;
  appointmentTrend: WeeklyTrendResponse;
  dailyAppointmentQueue: DailyQueueResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = '/analytics';

  private readonly clinicId = '68e49ca86df0f1f2a186d87f'

  constructor(private http: HttpClient) {}

  /**
   * pass clinicId here instead of having it as an existing property
   * if user is admin then dashboard should have a dropdown for clinics
   * if user is dentist then dashboard should use the user's clinic
   */
  getDashboardData(): Observable<DashboardData> {
    const summary$ = this.http.get<WeeklySummaryResponse>(`${this.baseUrl}/summary/${this.clinicId}`);
    const trend$ = this.http.get<WeeklyTrendResponse>(`${this.baseUrl}/trend/${this.clinicId}`);
    const queue$ = this.http.get<DailyQueueResponse[]>(`${this.baseUrl}/queue/${this.clinicId}`);

    return forkJoin({
      weeklyReport: summary$,
      appointmentTrend: trend$,
      dailyAppointmentQueue: queue$
    });
  }
}
