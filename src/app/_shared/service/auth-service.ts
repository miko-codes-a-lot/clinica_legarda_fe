import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, delay, Observable, tap, throwError } from 'rxjs';
import { User } from '../model/user';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MockService } from './mock-service';
import { LoginResponse } from '../model/response/login-response';
import { UserSimple } from '../model/user-simple';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserSimple | null>(null)
  currentUser$: Observable<UserSimple | null> = this.currentUserSubject.asObservable()

  mockUser: User

  constructor(
    private readonly mockService: MockService,
    private readonly http: HttpClient,
  ) {
    this.checkAuthStatus()
    this.mockUser = this.mockService.mockUser()
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/sign-in', { username, password }).pipe(
      tap(({ user }) => this.currentUserSubject.next(user)),
      catchError((error: HttpErrorResponse) => {
        let userMessage = 'Something bad happened; please try again later.';

        if (error.status === 400) {
          userMessage = 'Username or password is incorrect.';
        } else {
          // Generic fallback for other errors
          console.error(
            `Backend returned code ${error.status}, ` +
            `body was: ${JSON.stringify(error.error)}`);
        }
        
        return throwError(() => new Error(userMessage));
      })
    )
  }

  // login(username: string, password: string): Observable<LoginResponse> {
  //   return new Observable<LoginResponse>((s) => {
  //     setTimeout(() => {
  //       s.next({ user: this.mockUser })
  //       s.complete()
  //     }, 1000);
  //   }).pipe(
  //     tap(({ user }) => this.currentUserSubject.next(user))
  //   )
  // }

  logout() {
    return this.http.post('/auth/sign-out', {}).pipe(
      tap(() => this.currentUserSubject.next(null))
    )
    // return new Observable((s) => {
    //   setTimeout(() => {
    //     s.next(null)
    //     s.complete()
    //   }, 1000);
    // }).pipe(
    //   tap(() => this.currentUserSubject.next(null))
    // )
  }

  getProfile(): Observable<UserSimple> {
    return this.http.get<UserSimple>('/users/profile');
    // return new Observable((s) => {
    //   setTimeout(() => {
    //     s.next(this.mockUser)
    //     // s.error(new Error('Something went wrong'))
    //     s.complete()
    //   }, 500);
    // })
  }

  checkAuthStatus(): void {
    this.getProfile().subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: () => this.currentUserSubject.next(null)
    })
  }

  get currentUserValue(): UserSimple | null {
    return this.currentUserSubject.value
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue
  }
}
