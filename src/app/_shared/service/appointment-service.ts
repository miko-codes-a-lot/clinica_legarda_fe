import { Injectable } from '@angular/core';
import { Appointment, AppointmentStatus } from '../model/appointment';
import { Observable } from 'rxjs';
import { AppointmentPayload } from '../../admin/appointment/appointment-payload';
import { HttpClient } from '@angular/common/http';
import { MockService } from './mock-service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(
    private readonly http: HttpClient,
    private readonly mockService: MockService
  ) {}

  getEmptyNonNullDoc(): Appointment {
    const user = {
      firstName: '',
      middleName: '',
      lastName: '',
      emailAddress: '',
      mobileNumber: '',
      address: '',
      role: '',
      operatingHours: [],
      appointments: [],
    }

    const clinic = {
      name: '',
      address: '',
      mobileNumber: '',
      emailAddress: '',
      operatingHours: [],
      dentists: []
    }

    return {
      _id: '',
      clinic: Object.assign({}, clinic),
      dentist: Object.assign({}, user),
      patient: Object.assign({}, user),
      date: new Date(),
      startTime: '',
      endTime: '',
      services: [],
      status: AppointmentStatus.PENDING,
      notes: {
        clinicNotes: '',
        patientNotes: '',
      },
      history: [],
    }
  }
  
  private readonly baseUrl = '/appointments'; // adjust if your backend has a different base path

  // getAll(): Observable<Appointment[]> {
  //   return this.http.get<Appointment[]>(this.baseUrl, { withCredentials: true });
  // }

  getAll(patientId?: string): Observable<Appointment[]> {
    const options = {
      withCredentials: true,
      params: patientId ? { patient: patientId } : undefined
    };

    return this.http.get<Appointment[]>(this.baseUrl, options);
  }

  getOne(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  create(appointment: AppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, appointment, { withCredentials: true });
    // return new Observable((s) => {
    //   setTimeout(() => {
    //     const a: Appointment = {
    //       _id: '5',
    //       clinic: this.mockService.mockClinic(), // has to be the selected clinic
    //       dentist: this.mockService.mockUser(), // has to be the selected user (that is dentist)
    //       patient: this.mockService.mockUser(),// has to be the selected user (that is patient)
    //       history: [],
    //       services: [this.mockService.mockDentalService()],
    //       date: appointment.date,
    //       startTime: '09:00',
    //       endTime: '10:00',
    //       status: AppointmentStatus.PENDING,
    //       notes: {
    //         clinicNotes: '',
    //         patientNotes: ''
    //       }
    //     }
    //     s.next(a)
    //     s.complete()
    //   }, 1000);
    // })
  }

  update(id: string, appointment: AppointmentPayload): Observable<Appointment> {
      return this.http.put<Appointment>(`${this.baseUrl}/${id}`, appointment, { withCredentials: true });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
