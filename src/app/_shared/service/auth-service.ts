import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, delay, Observable, tap } from 'rxjs';
import { User } from '../model/user';
import { HttpClient } from '@angular/common/http';
import { MockService } from './mock-service';
import { LoginResponse } from '../model/login-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null)
  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable()

  mockUser: User

  constructor(
    private readonly mockService: MockService,
    private readonly http: HttpClient,
  ) {
    this.checkAuthStatus()
    this.mockUser = this.mockService.mockUser()
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return new Observable<LoginResponse>((s) => {
      setTimeout(() => {
        s.next({ user: this.mockUser })
        s.complete()
      }, 1000);
    }).pipe(
      tap(({ user }) => this.currentUserSubject.next(user))
    )
  }

  logout() {
    return new Observable((s) => {
      setTimeout(() => {
        s.next(null)
        s.complete()
      }, 1000);
    }).pipe(
      tap(() => this.currentUserSubject.next(null))
    )
  }

  getProfile(): Observable<User> {
    return new Observable((s) => {
      setTimeout(() => {
        s.next(this.mockUser)
        // s.error(new Error('Something went wrong'))
        s.complete()
      }, 500);
    })
  }

  checkAuthStatus(): void {
    this.getProfile().subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: () => this.currentUserSubject.next(null)
    })
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue
  }
}
