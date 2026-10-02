import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StaffShell } from '../_shared/ui/staff-shell/staff-shell';
import { UserSimple } from '../_shared/model/user-simple';
import { AuthService } from '../_shared/service/auth-service';
import { CommonModule } from '@angular/common';
import { AlertService } from '../_shared/service/alert.service';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    StaffShell,
  ],
  templateUrl: './super-admin.html',
  styleUrl: './super-admin.css'
})
export class SuperAdmin {
  private readonly destroyRef = inject(DestroyRef);
  isLoading = false
  isLoggedIn = false
  user: UserSimple | null = null
  activeTitle = 'Dashboard'; // default title
  activeIcon = 'dashboard';  // default icon
  showTopNav = false;
  showSideNav = true;

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', link: '/super-admin/dashboard' },
    { label: 'Clinics', icon: 'local_hospital', link: '/super-admin/clinic' },
    { label: 'User', icon: 'group', link: '/super-admin/user' },
    { label: 'Appointments', icon: 'event', link: '/super-admin/appointment' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly alertService: AlertService,
  ) {}

  get userName(): string {
    return this.user ? `${this.user.firstName} ${this.user.lastName}`.trim() : '';
  }

  ngOnInit() {
    this.activeTitle = this.menuItems.find(item => this.router.url.startsWith(item.link))?.label || 'Dashboard';
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
          this.user = user;
          this.isLoggedIn = !!user;
          this.updateTopNavVisibility();
      }
    })

        // Update activeTitle based on current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((event: NavigationEnd) => {
        const currentRoute = this.menuItems.find(item => event.urlAfterRedirects.startsWith(item.link));
        this.activeTitle = currentRoute ? currentRoute.label : 'Dashboard';
        this.activeIcon = currentRoute ? currentRoute.icon : 'dashboard';
        // get back in this later
        // hide side nave when user settings
        const url = event.urlAfterRedirects;
        this.showSideNav = !url.startsWith('/super-admin/user-settings');
        this.updateTopNavVisibility(event.urlAfterRedirects);
    });
  }

  // Utility to decide whether top nav should show
  updateTopNavVisibility(url?: string) {
    const currentUrl = url || this.router.url;
    // Hide on login page or if not logged in
    this.showTopNav = this.isLoggedIn && !currentUrl.includes('/super-admin/login');
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
