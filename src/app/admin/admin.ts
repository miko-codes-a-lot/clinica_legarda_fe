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
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    StaffShell,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {
  private readonly destroyRef = inject(DestroyRef);
  isLoading = false
  isLoggedIn = false
  user: UserSimple | null = null
  activeTitle = 'Dashboard'; // default title
  activeIcon = 'dashboard';  // default icon
  showTopNav = false;
  showSideNav = true;

  menuItems = [
    { label: 'Patient records', icon: 'folder_shared', link: '/admin/care/patients' },
    { label: 'Clinic closures', icon: 'event_busy', link: '/admin/care/closures' },
    { label: 'Treatment queue', icon: 'groups', link: '/admin/care/queue' },
    { label: 'Dashboard', icon: 'dashboard', link: '/admin/dashboard' },
    { label: 'User', icon: 'group', link: '/admin/user' },
    { label: 'Clinic', icon: 'local_hospital', link: '/admin/clinic' },
    { label: 'Service', icon: 'medical_services', link: '/admin/service' },
    { label: 'Appointments', icon: 'event', link: '/admin/appointment' },
    { label: 'Notifications', icon: 'notifications', link: '/admin/notification' },
    { label: 'Reason', icon: 'quickreply', link: '/admin/reason' },
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
        this.showSideNav = !url.startsWith('/admin/user-settings');
        this.updateTopNavVisibility(event.urlAfterRedirects);
    });
  }

  // Utility to decide whether top nav should show
  updateTopNavVisibility(url?: string) {
    const currentUrl = url || this.router.url;
    // Hide on login page or if not logged in
    this.showTopNav = this.isLoggedIn && !currentUrl.includes('/admin/login');
  }

  goToUserSettings() {
    this.router.navigate(['/admin/user-settings/index'])
  }

  onClickLogout() {
    this.isLoading = true

    this.authService.logout()
      .subscribe({
        next: () => this.router.navigate(['/admin/login']),
        error: (err) => this.alertService.error(`Something went wrong: ${err}`)
      })
      .add(() => this.isLoading = false)
  }
}
