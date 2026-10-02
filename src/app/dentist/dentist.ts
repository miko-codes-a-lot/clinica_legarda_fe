import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { StaffShell } from '../_shared/ui/staff-shell/staff-shell';
import { UserSimple } from '../_shared/model/user-simple';
import { AuthService } from '../_shared/service/auth-service';
import { AlertService } from '../_shared/service/alert.service';

@Component({
  selector: 'app-dentist',
  standalone: true,
  imports: [
    RouterOutlet,
    StaffShell,
  ],
  templateUrl: './dentist.html',
  styleUrl: './dentist.css'
})
export class Dentist {
  private readonly destroyRef = inject(DestroyRef);
  isLoading = false
  isLoggedIn = false
  user: UserSimple | null = null

  menuItems = [
    { label: 'Home', icon: 'home', link: '/dentist/homepage' },
    { label: 'Profile', icon: 'person', link: '/dentist/profile' },
    { label: 'Appointments', icon: 'event', link: '/dentist/appointment' },
    { label: 'Referral Request', icon: 'event', link: '/dentist/referral-request' },
    { label: 'Notifications', icon: 'notifications', link: '/dentist/notification' },

  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit() {
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

  get userName(): string {
    return this.user ? `${this.user.firstName} ${this.user.lastName}`.trim() : '';
  }

  get activeTitle(): string {
    return this.menuItems.find(item => this.router.url.startsWith(item.link))?.label || 'Home';
  }

  goToProfile(): void { this.router.navigate(['/dentist/profile']); }

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
