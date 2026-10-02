import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AffectedAppointment, ClinicClosure, ClosureDetail, ClosureInterval, ClosurePayload } from './closure.models';
@Injectable({ providedIn: 'root' })
export class ClosuresApiService {
  constructor(private readonly http: HttpClient) {}
  availability(clinic: string) { return this.http.get<ClosureInterval[]>('/clinic-closures/availability', { params: new HttpParams().set('clinic', clinic) }); }
  list(clinic?: string) { return this.http.get<ClinicClosure[]>('/clinic-closures', { params: clinic ? new HttpParams().set('clinic', clinic) : undefined }); }
  preview(payload: ClosurePayload) { return this.http.post<{ appointments: AffectedAppointment[]; total: number }>('/clinic-closures/preview', payload); }
  create(payload: ClosurePayload) { return this.http.post<ClosureDetail>('/clinic-closures', payload); }
  detail(id: string) { return this.http.get<ClosureDetail>(`/clinic-closures/${id}`); }
  reopen(id: string, reason: string) { return this.http.patch<ClosureDetail>(`/clinic-closures/${id}/reopen`, { reason }); }
  clear(id: string, reason: string) { return this.http.patch<{ message: string }>(`/appointments/${id}/clear-disruption`, { reason }); }
}
