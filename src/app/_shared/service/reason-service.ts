import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reason } from '../model/reason';

@Injectable({
  providedIn: 'root'
})
export class ReasonService {
  private readonly baseUrl = '/reasons';

  constructor(private readonly http: HttpClient) {}

  /** Read legacy code labels for historical records; new reasons are free text. */
  getAll(): Observable<Reason[]> {
    return this.http.get<Reason[]>(this.baseUrl);
  }
}
