import { Injectable } from '@angular/core';
import { Clinic } from '../model/clinic';
import { Observable } from 'rxjs';
import { MockService } from './mock-service';

@Injectable({
  providedIn: 'root'
})
export class ClinicService {
  constructor(private readonly mockService: MockService) {}

  getAll(): Observable<Clinic[]> {
    return new Observable((s) => {
      setTimeout(() => {
        const items = [
          this.mockService.mockClinic(),
        ]

        s.next(items)
        s.complete()
      }, 1000);
    })
  }

  getOne(id: string): Observable<Clinic> {
    return new Observable((s) => {
      setTimeout(() => {
        const clinic: Clinic = this.mockService.mockClinic()

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
