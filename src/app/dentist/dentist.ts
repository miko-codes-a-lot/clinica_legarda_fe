import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavComponent } from '../_shared/component/nav/nav.component';
import { AuthService } from '../_shared/service/auth-service';


@Component({
  selector: 'app-dentist',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    NavComponent,
  ],
  templateUrl: './dentist.html',
  styleUrl: './dentist.css'
})
export class Dentist {
  isLoading = false
  isLoggedIn = false
  user = {}

  menuItems = [
    { label: 'Profile', icon: 'person', link: '/dentist/profile' },
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
