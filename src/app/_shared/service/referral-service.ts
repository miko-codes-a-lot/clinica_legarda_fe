import { Injectable } from '@angular/core';
import { Referral } from '../model/referral';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ReferralPayload } from '../../admin/appointment/referral-payload';

@Injectable({
  providedIn: 'root'
})
export class ReferralService {
  constructor(
    private readonly http: HttpClient
  ) {}
  private readonly baseUrl = '/referrals'; // adjust if your backend has a different base path

  getAll(): Observable<Referral[]> {
    return this.http.get<Referral[]>(this.baseUrl, { withCredentials: true });
  }

  getAllByDentist(dentistId: string): Observable<Referral[]> {
    const url = `${this.baseUrl}/by-dentist/${dentistId}`;
    return this.http.get<Referral[]>(url, { withCredentials: true });
  }


  getOne(id: string): Observable<Referral> {
    return this.http.get<Referral>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  create(referral: ReferralPayload): Observable<Referral> {
    const result = this.http.post<Referral>(this.baseUrl, referral, { withCredentials: true });
    return result 
  }

  update(id: string, referral: ReferralPayload): Observable<Referral> {
      return this.http.put<Referral>(`${this.baseUrl}/${id}`, referral, { withCredentials: true });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }


  approveReferral(referralId: string) {
    console.log('referralId', referralId);
    return this.http.patch<Referral>(`${this.baseUrl}/${referralId}/approve`, {}, { withCredentials: true });
  }

  rejectReferral(referralId: string) {
    return this.http.patch<Referral>(`${this.baseUrl}/${referralId}/reject`, {}, { withCredentials: true });
  }

  cancelReferral(referralId: string) {
    return this.http.patch<Referral>(`${this.baseUrl}/${referralId}/cancel`, {}, { withCredentials: true });
  }
}
