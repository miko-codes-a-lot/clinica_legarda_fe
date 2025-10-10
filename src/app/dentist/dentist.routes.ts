import { Routes } from '@angular/router';
import { Dentist } from './dentist';
import { AuthGuard } from '../_shared/guard/auth-guard';

export const DENTIST_ROUTES: Routes = [
  {
    path: '',
    component: Dentist,
    children: [
      {
        path: '',
        redirectTo: '/dentist/profile',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        canActivate: [AuthGuard],
        data: { role: 'dentist' },
        loadChildren: () => import('./profile/profile.route').then(m => m.PROFILE_ROUTES)
      },
      {
        path: 'appointment',
        canActivate: [AuthGuard],
        data: { role: 'dentist' },
        loadChildren: () => import('./appointment/appointment.routes').then(m => m.APPOINTMENT_ROUTES)
      },
      {
        path: 'notification',
        canActivate: [AuthGuard],
        data: { role: 'dentist' },
        loadChildren: () => import('./notification/notification.route').then(m => m.NOTIFICATION_ROUTES)
      },
    ]
  }
];
