import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { CareVisit, CheckInPayload, PatientRecord, PatientSearchQuery, PatientSearchResult } from './care.models';

export function careError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (body && typeof body === 'object' && 'message' in body) {
      if (typeof body.message === 'string') return body.message;
      if (Array.isArray(body.message) && body.message.every(item => typeof item === 'string')) return body.message.join(' ');
    }
  }
  return 'The request could not be completed. Please try again.';
}

@Injectable({ providedIn: 'root' })
export class CareApiService {
  constructor(private readonly http: HttpClient) {}
  searchPatients(query: PatientSearchQuery) {
    let params = new HttpParams().set('page', query.page ?? 1);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.clinic) params = params.set('clinic', query.clinic);
    return this.http.get<PatientSearchResult>('/care/patients', { params });
  }
  patientRecord(id: string, clinic?: string) {
    const params = clinic ? new HttpParams().set('clinic', clinic) : undefined;
    return this.http.get<PatientRecord>(`/care/patients/${id}`, { params });
  }
  visits(query: { clinic?: string; patient?: string; date?: string }, queue = false) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) if (value) params = params.set(key, value);
    return this.http.get<CareVisit[]>(queue ? '/care/queue' : '/care/visits', { params });
  }
  checkIn(payload: CheckInPayload) { return this.http.post<CareVisit>('/care/visits', payload); }
  visit(id: string) { return this.http.get<CareVisit>(`/care/visits/${id}`); }
  transitionVisit(id: string, state: 'in_progress' | 'cancelled', reason?: string) {
    return this.http.patch<CareVisit>(`/care/visits/${id}/state`, { state, ...(reason ? { reason } : {}) });
  }
}
