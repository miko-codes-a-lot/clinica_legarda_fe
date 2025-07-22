import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  create(user: User): Observable<User> {
    return new Observable((s) => {
      setTimeout(() => {
        user.id = 5
        s.next(user)
        s.complete()
      }, 1000);
    })
  }

  update(id: number, user: User) {
    return new Observable((s) => {
      setTimeout(() => {
        user.id = id
        s.next(user)
        s.complete()
      }, 1000);
    })
  }
}
