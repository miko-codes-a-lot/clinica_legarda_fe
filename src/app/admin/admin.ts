import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavComponent } from '../_shared/component/nav/nav.component';
import { AuthService } from '../_shared/service/auth-service';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    NavComponent,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {
  isLoading = false
  isLoggedIn = false
  user = {}

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', link: '/admin/dashboard' },
    { label: 'User', icon: 'group', link: '/admin/user' },
    { label: 'Clinic', icon: 'local_hospital', link: '/admin/clinic' },
    { label: 'Service', icon: 'medical_services', link: '/admin/service' },
    { label: 'Appointments', icon: 'event', link: '/admin/appointment' },
    { label: 'Notifications', icon: 'notifications', link: '/admin/notification' },
    {
      label: 'Logout',
      icon: 'logout',
      onClick: () => this.onClickLogout()
    }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.user = user
          console.log('this.user', this.user)
          this.isLoggedIn = true
        } else {
          this.isLoggedIn = false
        }
      }
    })
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
