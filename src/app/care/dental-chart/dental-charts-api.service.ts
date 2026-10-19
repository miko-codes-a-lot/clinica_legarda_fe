import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DentalChartPayload, DentalChartResponse, Dentition } from './dental-chart.models';
@Injectable({ providedIn: 'root' })
export class DentalChartsApiService {
  constructor(private readonly http: HttpClient) {}
  clinics() { return this.http.get<{ _id: string; name: string }[]>('/dental-charts/clinics'); }
  read(patient: string, clinic: string, dentition: Dentition, revision?: number) {
    let params = new HttpParams().set('clinic', clinic).set('dentition', dentition); if (revision !== undefined) params = params.set('revision', revision);
    return this.http.get<DentalChartResponse>(`/dental-charts/${patient}`, { params });
  }
  save(patient: string, payload: DentalChartPayload) { return this.http.put<DentalChartResponse>(`/dental-charts/${patient}`, payload); }
}
