import { Injectable } from '@angular/core';
import { Clinic } from '../model/clinic';
import { Observable } from 'rxjs';

const mockClinic: () => Clinic = () => ({
  _id: '1',
  name: 'Clinica Legarda Dental Clinic',
  address: '2275 Legarda st. Sampaloc Manila',
  mobileNumber: '+639391112236',
  emailAddress: 'contact@clinicalegarda.com',
  operatingHours: [
    { day: 'Monday', startTime: '09:00', endTime: '18:00' },
    { day: 'Tuesday', startTime: '09:00', endTime: '18:00' },
    { day: 'Wednesday', startTime: '09:00', endTime: '18:00' },
    { day: 'Thursday', startTime: '09:00', endTime: '18:00' },
    { day: 'Friday', startTime: '09:00', endTime: '18:00' },
    { day: 'Saturday', startTime: '10:00', endTime: '15:00' },
    { day: 'Sunday', startTime: '10:00', endTime: '15:00' },
  ]
})


@Injectable({
  providedIn: 'root'
})
export class ClinicService {
  getAll(): Observable<Clinic[]> {
    return new Observable((s) => {
      setTimeout(() => {
        const items = [
          mockClinic()
        ]

        s.next(items)
        s.complete()
      }, 1000);
    })
  }

  getOne(id: string): Observable<Clinic> {
    return new Observable((s) => {
      setTimeout(() => {
        const clinic: Clinic = mockClinic()

        s.next(clinic)
        s.complete()
      }, 1000);
    })
  }

  create(clinic: Clinic): Observable<Clinic> {
    return new Observable((s) => {
      setTimeout(() => {
        clinic._id = '5'
        s.next(clinic)
        s.complete()
      }, 1000);
    })
  }

  update(id: string, clinic: Clinic): Observable<Clinic> {
    return new Observable((s) => {
      setTimeout(() => {
        clinic._id = 'id'
        s.next(clinic)
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
