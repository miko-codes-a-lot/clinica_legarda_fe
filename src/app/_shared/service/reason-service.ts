import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reason } from '../model/reason';

@Injectable({
  providedIn: 'root'
})
export class ReasonService {
  private readonly baseUrl = '/reasons'; // adjust if your backend has a different base path

  constructor(private readonly http: HttpClient) {}

  /** Get all reasons */
  getAll(): Observable<Reason[]> {
    return this.http.get<Reason[]>(this.baseUrl);
  }

  /** Get a reason by id */
  findOne(id: string): Observable<Reason> {
    console.log('reason details id: ', id);
    return this.http.get<Reason>(`${this.baseUrl}/${id}`);
  }

  /** Create a new reason */
  create(reason: Reason): Observable<Reason> {
    return this.http.post<Reason>(this.baseUrl, reason);
  }

  /** Update an existing reason */
  update(id: string, reason: Reason): Observable<Reason> {
    return this.http.put<Reason>(`${this.baseUrl}/${id}`, reason);
  }

  /** Delete a reason */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
