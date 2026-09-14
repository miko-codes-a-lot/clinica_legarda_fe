import { Component, DestroyRef, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavComponent } from '../_shared/component/nav/nav.component';
import { AuthService } from '../_shared/service/auth-service';
import { AlertService } from '../_shared/service/alert.service';

@Component({
  selector: 'app-dentist',
  standalone: true,
  imports: [
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    NavComponent,
  ],
  templateUrl: './dentist.html',
  styleUrl: './dentist.css'
})
export class Dentist {
  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpoints = inject(BreakpointObserver);
  isMobile = false;
  menuOpen = false;
  isLoading = false
  isLoggedIn = false
  user = {}

  menuItems = [
    { label: 'Home', icon: 'home', link: '/dentist/homepage' },
    { label: 'Profile', icon: 'person', link: '/dentist/profile' },
    { label: 'Appointments', icon: 'event', link: '/dentist/appointment' },
    { label: 'Referral Request', icon: 'event', link: '/dentist/referral-request' },
    { label: 'Notifications', icon: 'notifications', link: '/dentist/notification' },
    {
      label: 'Logout',
      icon: 'logout',
      onClick: () => this.onClickLogout()
    }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit() {
    this.breakpoints.observe('(max-width: 767px)').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      this.isMobile = state.matches;
      this.menuOpen = false;
    });
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        if (user) {
          this.user = user
          this.isLoggedIn = true
        } else {
          this.isLoggedIn = false
        }
      }
    })
  }

  closeMobileMenu(): void {
    if (this.isMobile) this.menuOpen = false;
  }

  onClickLogout() {
    this.isLoading = true

    this.authService.logout()
      .subscribe({
        next: () => this.router.navigate(['/admin/login']),
        error: (err) => this.alertService.error(err.error.message)
      })
      .add(() => this.isLoading = false)
  }
}
