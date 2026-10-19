import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
export interface DentistAvailabilityInterval { startTime: string; endTime: string; }
export interface PublicDentistDay { date: string; intervals: DentistAvailabilityInterval[]; }
export interface DentistDayAvailability extends PublicDentistDay { _id?: string; clinic?: string; dentist?: string; revision: number; useWeeklyHours?: boolean; }
export interface AvailabilityPayload { clinic: string; intervals: DentistAvailabilityInterval[]; expectedRevision: number; restoreWeeklyHours?: boolean; acknowledgedAppointmentIds?: string[]; }
export interface AvailabilityAffected { _id: string; date?: string; startTime: string; endTime: string; status?: string; patient?: { firstName: string; lastName: string }; }
@Injectable({ providedIn: 'root' })
export class DentistAvailabilityApi {
  constructor(private readonly http: HttpClient) {}
  private params(clinic: string, from: string, to: string) { return new HttpParams().set('clinic', clinic).set('from', from).set('to', to); }
  list(dentist: string, clinic: string, from: string, to: string) { return this.http.get<DentistDayAvailability[]>(`/dentist-availability/${dentist}`, { params: this.params(clinic, from, to) }); }
  publicDays(dentist: string, clinic: string, from: string, to: string) { return this.http.get<PublicDentistDay[]>(`/dentist-availability/${dentist}/public`, { params: this.params(clinic, from, to) }); }
  preview(dentist: string, date: string, payload: AvailabilityPayload) { return this.http.post<{ appointments: AvailabilityAffected[]; total: number }>(`/dentist-availability/${dentist}/days/${date}/preview`, payload); }
  save(dentist: string, date: string, payload: AvailabilityPayload) { return this.http.put<DentistDayAvailability>(`/dentist-availability/${dentist}/days/${date}`, payload); }
}
