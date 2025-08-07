import { Injectable } from '@angular/core';
import { MockService } from './mock-service';
import { DentalService } from '../model/dental-service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DentalServicesService {
    constructor(private readonly mockService: MockService) {}

    getEmptyOrNullDoc(): DentalService {
      return {
        name: '',
        duration: 30,
      }
    }
  
    getAll(): Observable<DentalService[]> {
      return new Observable((s) => {
        setTimeout(() => {
          const items = [
            this.mockService.mockDentalService()
          ]
  
          s.next(items)
          s.complete()
        }, 1000);
      })
    }
  
    getOne(id: string): Observable<DentalService> {
      return new Observable((s) => {
        setTimeout(() => {
          const dentalService: DentalService = this.mockService.mockDentalService()
  
          s.next(dentalService)
          s.complete()
        }, 1000);
      })
    }
  
    create(dentalService: DentalService): Observable<DentalService> {
      return new Observable((s) => {
        setTimeout(() => {
          dentalService._id = '5'
          s.next(dentalService)
          s.complete()
        }, 1000);
      })
    }
  
    update(id: string, dentalService: DentalService): Observable<DentalService> {
      return new Observable((s) => {
        setTimeout(() => {
          dentalService._id = 'id'
          s.next(dentalService)
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
