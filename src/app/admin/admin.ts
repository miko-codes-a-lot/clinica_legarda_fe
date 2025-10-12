import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavComponent } from '../_shared/component/nav/nav.component';
import { AuthService } from '../_shared/service/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    NavComponent,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {
  isLoading = false
  isLoggedIn = false
  user = {}
  activeTitle = 'Dashboard'; // default title
  activeIcon = 'dashboard';  // default icon
  showTopNav = false;

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', link: '/admin/dashboard' },
    { label: 'User', icon: 'group', link: '/admin/user' },
    { label: 'Clinic', icon: 'local_hospital', link: '/admin/clinic' },
    { label: 'Service', icon: 'medical_services', link: '/admin/service' },
    { label: 'Appointments', icon: 'event', link: '/admin/appointment' },
    { label: 'Notifications', icon: 'notifications', link: '/admin/notification' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe({
      next: (user) => {
          this.user = user || {};
          this.isLoggedIn = !!user;
          this.updateTopNavVisibility();
      }
    })

        // Update activeTitle based on current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentRoute = this.menuItems.find(item => event.urlAfterRedirects.startsWith(item.link));
        this.activeTitle = currentRoute ? currentRoute.label : 'Dashboard';
        this.activeIcon = currentRoute ? currentRoute.icon : 'dashboard';
        this.updateTopNavVisibility(event.urlAfterRedirects);
    });
  }

  // Utility to decide whether top nav should show
  updateTopNavVisibility(url?: string) {
    const currentUrl = url || this.router.url;
    // Hide on login page or if not logged in
    this.showTopNav = this.isLoggedIn && !currentUrl.includes('/admin/login');
  }

  onClickLogout() {
    this.isLoading = true

    this.authService.logout()
      .subscribe({
        next: () => this.router.navigate(['/admin/login']),
        error: (err) => alert(`Something went wrong: ${err}`)
      })
      .add(() => this.isLoading = false)
  }
}
