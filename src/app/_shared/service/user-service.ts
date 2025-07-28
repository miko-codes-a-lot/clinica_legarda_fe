import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../model/user';
import { MockService } from './mock-service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private readonly mockService: MockService) {}

  getAll(): Observable<User[]> {
    return new Observable((s) => {
      setTimeout(() => {
        const items = [
          this.mockService.mockUser()
        ]

        s.next(items)
        s.complete()
      }, 1000);
    })
  }

  getOne(id: string): Observable<User> {
    return new Observable((s) => {
      setTimeout(() => {
        const user = this.mockService.mockUser()

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
