import { Injectable } from '@angular/core';
import { Branch } from '../model/branch';
import { Observable } from 'rxjs';

const mockBranch: () => Branch = () => ({
  _id: '1',
  name: 'Branch A',
  address: '2275 Legarda st. Sampaloc Manila',
  mobileNumber: '+639391112236',
  emailAddress: 'contact@clinicalegarda.com',
  clinic: {
    _id: '1',
    name: 'Clinica Legarda Dental Clinic',
    address: '2275 Legarda st. Sampaloc Manila',
    mobileNumber: '+639391112236',
    emailAddress: 'contact@clinicalegarda.com',
    operatingHours: [
      { day: 'monday', startTime: '09:00', endTime: '18:00' },
      { day: 'tuesday', startTime: '09:00', endTime: '18:00' },
      { day: 'wednesday', startTime: '09:00', endTime: '18:00' },
      { day: 'thursday', startTime: '09:00', endTime: '18:00' },
      { day: 'friday', startTime: '09:00', endTime: '18:00' },
      { day: 'saturday', startTime: '10:00', endTime: '15:00' },
      { day: 'sunday', startTime: '10:00', endTime: '15:00' },
    ]
  }
})

@Injectable({
  providedIn: 'root'
})
export class BranchService {
    getAll(): Observable<Branch[]> {
      return new Observable((s) => {
        setTimeout(() => {
          const items = [
            mockBranch()
          ]
  
          s.next(items)
          s.complete()
        }, 1000);
      })
    }
  
    getOne(id: string): Observable<Branch> {
      return new Observable((s) => {
        setTimeout(() => {
          const branch: Branch = mockBranch()
  
          s.next(branch)
          s.complete()
        }, 1000);
      })
    }
  
    create(branch: Branch): Observable<Branch> {
      return new Observable((s) => {
        setTimeout(() => {
          branch._id = '5'
          s.next(branch)
          s.complete()
        }, 1000);
      })
    }
  
    update(id: string, branch: Branch): Observable<Branch> {
      return new Observable((s) => {
        setTimeout(() => {
          branch._id = 'id'
          s.next(branch)
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
