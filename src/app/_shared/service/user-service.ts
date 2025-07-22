import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  getOne(id: number): Observable<User> {
    return new Observable((s) => {
      setTimeout(() => {
        const user: User = {
          id: 1,
          firstName: 'Juan',
          middleName: 'Della',
          lastName: 'Cruz',
          emailAddress: 'juan@gmail.com',
          mobileNumber: '09394252236',
          address: 'blk 2 lot 75',
          roles: 'dentist',
        }

        s.next(user)
        s.complete()
      }, 1000);
    })
  }

  create(user: User): Observable<User> {
    return new Observable((s) => {
      setTimeout(() => {
        user.id = 5
        s.next(user)
        s.complete()
      }, 1000);
    })
  }

  update(id: number, user: User): Observable<User> {
    return new Observable((s) => {
      setTimeout(() => {
        user.id = id
        s.next(user)
        s.complete()
      }, 1000);
    })
  }
}
