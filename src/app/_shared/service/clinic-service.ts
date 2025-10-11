import { Injectable } from '@angular/core';
import { Clinic } from '../model/clinic';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClinicService {
  constructor(
    private readonly http: HttpClient
  ) {}
  private readonly baseUrl = '/clinics'; // adjust if your backend has a different base path

  getAll(): Observable<Clinic[]> {
    return this.http.get<Clinic[]>(this.baseUrl, { withCredentials: true });
  }

  getOne(id: string): Observable<Clinic> {
    return this.http.get<Clinic>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  create(clinic: Clinic): Observable<Clinic> {
    return this.http.post<Clinic>(this.baseUrl, clinic, { withCredentials: true });
  }

  update(id: string, clinic: Clinic): Observable<Clinic> {
      return this.http.put<Clinic>(`${this.baseUrl}/${id}`, clinic, { withCredentials: true });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
