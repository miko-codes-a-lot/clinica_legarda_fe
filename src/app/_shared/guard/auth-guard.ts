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
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const expectedRole = route.data['role'] as string; // e.g., 'dentist' or 'admin'

    return this.authService.currentUser$.pipe(
      map(user => {
        if (!expectedRole) return true

        if (user?.role === expectedRole) {
          return true
        } else {
          if (user?.role === 'dentist') {
            this.router.navigate(['/dentist/profile']);
          } else if (user?.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (user?.role === 'user') {
            this.router.navigate(['/app/my-appointment']);
          } else {
            this.router.navigate(['/admin/login']);
          }
        }

        return false
      })
    );
  }
}
