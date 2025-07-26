import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../model/user';

const mockUser: () => User = () => ({
  _id: '1',
  firstName: 'Juan',
  middleName: 'Della',
  lastName: 'Cruz',
  emailAddress: 'juan@gmail.com',
  mobileNumber: '09394252236',
  address: 'blk 2 lot 75',
  roles: 'dentist',
})

@Injectable({
  providedIn: 'root'
})
export class UserService {
  getAll(): Observable<User[]> {
    return new Observable((s) => {
      setTimeout(() => {
        const items = [
          mockUser()
        ]

        s.next(items)
        s.complete()
      }, 1000);
    })
  }

  getOne(id: string): Observable<User> {
    return new Observable((s) => {
      setTimeout(() => {
        const user = mockUser()

        s.next(user)
        s.complete()
      }, 1000);
    })
  }

  create(user: User): Observable<User> {
    return new Observable((s) => {
      setTimeout(() => {
        user._id = '5'
        s.next(user)
        s.complete()
      }, 1000);
    })
  }

  update(id: string, user: User): Observable<User> {
    return new Observable((s) => {
      setTimeout(() => {
        user._id = 'id'
        s.next(user)
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
