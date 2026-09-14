import { Injectable } from '@angular/core';
import { Appointment, AppointmentStatus } from '../model/appointment';
import { UserStatus } from '../model/user';
import { Observable, Subject, tap } from 'rxjs';
import { AppointmentPayload } from '../../admin/appointment/appointment-payload';
import { HttpClient } from '@angular/common/http';
import { MockService } from './mock-service';
import { AppointmentAvailability } from '../model/booking-availability';

export interface RescheduleAppointmentPayload {
  date: Date | string;
  startTime: string;
  endTime: string;
  patient?: string;
  dentist?: string;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly changes = new Subject<void>();
  readonly changes$ = this.changes.asObservable();
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

  getAllByDentist(dentistId: string): Observable<Appointment[]> {
    const url = `${this.baseUrl}/by-dentist/${dentistId}`;
    return this.http.get<Appointment[]>(url, { withCredentials: true });
  }

  getAvailability(dentistId: string): Observable<AppointmentAvailability[]> {
    return this.http.get<AppointmentAvailability[]>(`${this.baseUrl}/availability/${dentistId}`, { withCredentials: true });
  }

  getOne(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  create(appointment: AppointmentPayload): Observable<Appointment> {
    
    if(appointment.date) {
      const d = new Date(appointment.date);
      appointment.date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    return this.http.post<Appointment>(this.baseUrl, appointment, { withCredentials: true }).pipe(tap(() => this.changes.next()));
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
    if(appointment.date) {
      const d = new Date(appointment.date);
      appointment.date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    return this.http.put<Appointment>(`${this.baseUrl}/${id}`, appointment, { withCredentials: true }).pipe(tap(() => this.changes.next()));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true }).pipe(tap(() => this.changes.next()));
  }

  approveAppointment(appointmentId: string) {
    return this.http.patch<Appointment>(`${this.baseUrl}/${appointmentId}/approve`, {}, { withCredentials: true }).pipe(tap(() => this.changes.next()));
  }

  rejectAppointment(appointmentId: string) {
    return this.http.patch<Appointment>(`${this.baseUrl}/${appointmentId}/reject`, {}, { withCredentials: true }).pipe(tap(() => this.changes.next()));
  }

  cancelAppointment(appointmentId: string, reason?: string) {
    return this.http.patch<Appointment>(`${this.baseUrl}/${appointmentId}/cancel`, { reason }, { withCredentials: true }).pipe(tap(() => this.changes.next()));
  }

  rescheduleAppointment(appointmentId: string, payload: RescheduleAppointmentPayload) {
    // Date pickers provide local Dates; a YYYY-MM-DD string is already a calendar day.
    const date = payload.date instanceof Date
      ? new Date(Date.UTC(payload.date.getFullYear(), payload.date.getMonth(), payload.date.getDate()))
      : payload.date;
    return this.http.patch<Appointment>(
      `${this.baseUrl}/${appointmentId}/reschedule`,
      { ...payload, date },
      { withCredentials: true }
    ).pipe(tap(() => this.changes.next()));
  }
  updateDentistNotes(appointmentId: string, notes: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${appointmentId}/notes`, {
      clinicNotes: notes
    });
  }
}
