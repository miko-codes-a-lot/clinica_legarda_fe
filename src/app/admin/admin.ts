import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavComponent } from '../_shared/component/nav/nav.component';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, MatListModule, MatToolbarModule, NavComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {
  menuItems = [
    { label: 'User', icon: 'group', link: '/admin/user' },
    { label: 'Clinic', icon: 'local_hospital', link: '/admin/clinic' },
    { label: 'Branch', icon: 'domain', link: '/admin/branch' },
    { label: 'Service', icon: 'medical_services', link: '/admin/service' },
    { label: 'Appointments', icon: 'event', link: '/admin/appointment' },
    { label: 'Notifications', icon: 'notifications', link: '/admin/notification' },
    { label: 'Logout', icon: 'logout', link: '/admin/logout' }
  ];
}
