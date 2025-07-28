import { Injectable } from '@angular/core';
import { MockService } from './mock-service';
import { Appointment, AppointmentStatus } from '../model/appointment';
import { Observable } from 'rxjs';
import { AppointmentPayload } from '../../admin/appointment/appointment-payload';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(private readonly mockService: MockService) {}

  getEmptyNonNullDoc(): Appointment {
    const user = {
      firstName: '',
      middleName: '',
      lastName: '',
      emailAddress: '',
      mobileNumber: '',
      address: '',
      roles: ''
    }
    return {
      _id: '',
      dentist: Object.assign({}, user),
      patient: Object.assign({}, user),
      date: new Date(),
      services: [],
      status: AppointmentStatus.PENDING,
      notes: {
        clinicNotes: '',
        patientNotes: '',
      },
      history: [],
    }
  }

  getAll(): Observable<Appointment[]> {
    return new Observable((s) => {
      setTimeout(() => {
        const items = [
          this.mockService.mockAppointment()
        ]

        s.next(items)
        s.complete()
      }, 1000);
    })
  }

  getOne(id: string): Observable<Appointment> {
    return new Observable((s) => {
      setTimeout(() => {
        const appointment: Appointment = this.mockService.mockAppointment()

        s.next(appointment)
        s.complete()
      }, 1000);
    })
  }

  create(appointment: AppointmentPayload): Observable<Appointment> {
    return new Observable((s) => {
      setTimeout(() => {
        const a: Appointment = {
          _id: '5',
          dentist: this.mockService.mockUser(),
          patient: this.mockService.mockUser(),
          history: [],
          services: [this.mockService.mockDentalService()],
          date: appointment.date,
          status: AppointmentStatus.PENDING,
          notes: {
            clinicNotes: '',
            patientNotes: ''
          }
        }
        s.next(a)
        s.complete()
      }, 1000);
    })
  }

  update(id: string, appointment: AppointmentPayload): Observable<Appointment> {
    return new Observable((s) => {
      setTimeout(() => {
        const appointment = this.mockService.mockAppointment()

        s.next(appointment)
        s.complete()
      }, 1000);
    })
  }

  delete(): Observable<void> {
    return new Observable((s) => {
      setTimeout(() => {
        s.next()
        s.complete()
      }, 1000);
    })
  }
}
