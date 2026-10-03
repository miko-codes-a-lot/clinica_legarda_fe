import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { CareVisit, CheckInPayload, PatientRecord, PatientSearchQuery, PatientSearchResult, TreatmentCase, TreatmentCaseDetail, VisitRecordPayload } from './care.models';

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
    if (query.status) params = params.set('status', query.status);
    if (query.registration) params = params.set('registration', query.registration);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.direction) params = params.set('direction', query.direction);
    return this.http.get<PatientSearchResult>('/care/patients', { params });
  }
  patientRecord(id: string, clinic?: string) {
    const params = clinic ? new HttpParams().set('clinic', clinic) : undefined;
    return this.http.get<PatientRecord>(`/care/patients/${id}`, { params });
  }
  visits(query: { clinic?: string; patient?: string; date?: string; appointment?: string }, queue = false) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) if (value) params = params.set(key, value);
    return this.http.get<CareVisit[]>(queue ? '/care/queue' : '/care/visits', { params });
  }
  checkIn(payload: CheckInPayload) { return this.http.post<CareVisit>('/care/visits', payload); }
  visit(id: string) { return this.http.get<CareVisit>(`/care/visits/${id}`); }
  transitionVisit(id: string, state: 'in_progress' | 'cancelled', reason?: string) {
    return this.http.patch<CareVisit>(`/care/visits/${id}/state`, { state, ...(reason ? { reason } : {}) });
  }
  saveVisitRecord(id: string, payload: VisitRecordPayload) { return this.http.put<CareVisit>(`/care/visits/${id}/record`, payload); }
  cases(patient?: string, clinic?: string) {
    let params = new HttpParams();
    if (patient) params = params.set('patient', patient);
    if (clinic) params = params.set('clinic', clinic);
    return this.http.get<TreatmentCase[]>('/care/cases', { params });
  }
  treatmentCase(id: string) { return this.http.get<TreatmentCaseDetail>(`/care/cases/${id}`); }
  createCase(payload: { consultationVisit: string; title: string; plan: string; internalNotes: string }) { return this.http.post<TreatmentCaseDetail>('/care/cases', payload); }
  closeCase(id: string, status: 'completed' | 'discontinued', revision: number) { return this.http.patch<TreatmentCaseDetail>(`/care/cases/${id}`, { status, revision }); }
}
