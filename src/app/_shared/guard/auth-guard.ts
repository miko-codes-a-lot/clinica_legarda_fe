import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { Observable, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const expectedRole = route.data['role'] as string; // e.g., 'dentist' or 'admin'

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/admin/login']); // default login page
      return of(false);
    }
  return this.authService.currentUser$.pipe(
      map(user => {
        if (user?.role === expectedRole) {
          return true; // user has the required role
        } else {
          // redirect to their default page based on role
          if (user?.role === 'dentist') {
            this.router.navigate(['/dentist/profile']);
          } else if (user?.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/login']);
          }
          return false;
        }
      })
    );
    // if (this.authService.isLoggedIn()) {
    //   this.authService.currentUser$.subscribe({
    //     next: (user) => {
    //       if (user?.role === 'dentist') {
    //         // then this should only activate all the link to dentist page
    //         console.log('user auth guard', user)
    //       } else {
    //         // then this should only activate all the link to admin page
    //       }
    //     }
    //   })
    //   return true
    // } else {
    //   this.router.navigate(['/admin/login'])
    //   return false
    // }
  }
}
