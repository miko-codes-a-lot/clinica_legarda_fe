import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UserStatus } from '../../_shared/model/user';
export interface PatientIdentity { _id: string; firstName: string; middleName?: string; lastName: string; birthDate?: string; sex?: string; status?: UserStatus; isDependent?: boolean; guardian?: string; }
export interface DependentPayload { firstName: string; middleName?: string; lastName: string; birthDate: string; sex?: string; }
@Injectable({ providedIn: 'root' })
export class DependentsApiService {
  constructor(private readonly http: HttpClient) {}
  list() { return this.http.get<PatientIdentity[]>('/dependents'); }
  create(payload: DependentPayload) { return this.http.post<PatientIdentity>('/dependents', payload); }
  update(id: string, payload: DependentPayload) { return this.http.put<PatientIdentity>(`/dependents/${id}`, payload); }
  unlink(id: string, expectedGuardian?: string) { return this.http.delete<{ message: string }>(`/dependents/${id}/guardian`, { params: expectedGuardian ? new HttpParams().set('expectedGuardian', expectedGuardian) : undefined }); }
  link(id: string, guardian: string) { return this.http.put<PatientIdentity>(`/dependents/${id}/guardian`, { guardian, confirmExistingPatient: true }); }
}
