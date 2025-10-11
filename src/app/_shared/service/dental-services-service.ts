import { Injectable } from '@angular/core';
import { DentalService } from '../model/dental-service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DentalServicesService {
    constructor(private readonly http: HttpClient) {}
    private readonly baseUrl = '/dental-catalog'; // adjust if your backend has a different base path

    getEmptyOrNullDoc(): DentalService {
      return {
        name: '',
        duration: 30,
      }
    }
  
    getAll(): Observable<DentalService[]> {
      return this.http.get<DentalService[]>(this.baseUrl, { withCredentials: true });
    }
  
    getOne(id: string): Observable<DentalService> {
      return this.http.get<DentalService>(`${this.baseUrl}/${id}`, { withCredentials: true });
    }
  
    create(dentalService: DentalService): Observable<DentalService> {
      return this.http.post<DentalService>(this.baseUrl, dentalService, { withCredentials: true });
    }
  
    update(id: string, dentalService: DentalService): Observable<DentalService> {
      return this.http.put<DentalService>(`${this.baseUrl}/${id}`, dentalService, { withCredentials: true });
    }
  
    delete(id: string): Observable<void> {
      return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
    }
}
