import { Injectable } from '@angular/core';
import { Branch } from '../model/branch';
import { Observable } from 'rxjs';
import { BranchPayload } from '../../admin/branch/branch-form/branch-payload';
import { MockService } from './mock-service';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  constructor(private readonly mockService: MockService) {}

  getEmptyNonNullBranch(): Branch {
    return {
      name: '',
      address: '',
      mobileNumber: '',
      emailAddress: '',
      clinic: {
        _id: '',
        name: '',
        address: '',
        mobileNumber: '',
        emailAddress: '',
        operatingHours: [
          { day: 'monday', startTime: '09:00', endTime: '18:00' },
          { day: 'tuesday', startTime: '09:00', endTime: '18:00' },
          { day: 'wednesday', startTime: '09:00', endTime: '18:00' },
          { day: 'thursday', startTime: '09:00', endTime: '18:00' },
          { day: 'friday', startTime: '09:00', endTime: '18:00' },
          { day: 'saturday', startTime: '10:00', endTime: '15:00' },
          { day: 'sunday', startTime: '10:00', endTime: '15:00' },
        ],
        dentists: [],
        // branches: [],
      },
  }
  }

  getAll(): Observable<Branch[]> {
    return new Observable((s) => {
      setTimeout(() => {
        const items = [
          this.mockService.mockBranch()
        ]

        s.next(items)
        s.complete()
      }, 1000);
    })
  }

  getOne(id: string): Observable<Branch> {
    return new Observable((s) => {
      setTimeout(() => {
        const branch: Branch = this.mockService.mockBranch()

        s.next(branch)
        s.complete()
      }, 1000);
    })
  }

  create(branch: BranchPayload): Observable<Branch> {
    return new Observable((s) => {
      setTimeout(() => {
        const b: Branch = {
          ...branch,
          _id: '5',
          clinic: this.mockService.mockClinic(),
        }
        s.next(b)
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
