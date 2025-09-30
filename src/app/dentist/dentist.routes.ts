import { Routes } from '@angular/router';
import { Dentist } from './dentist';
import { LoginAdmin } from './login-admin/login-admin';
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
      // {
      //   path: 'user',
      //   canActivate: [AuthGuard],
      //   loadChildren: () => import('./user/user.routes').then(m => m.USER_ROUTES)
      // },
      // {
      //   path: 'clinic',
      //   canActivate: [AuthGuard],
      //   loadChildren: () => import('./clinic/clinic.routes').then(m => m.CLINIC_ROUTES)
      // },
      // {
      //   path: 'service',
      //   canActivate: [AuthGuard],
      //   loadChildren: () => import('./dental-service/dental-service.routes').then(m => m.DENTAL_SERVICE)
      // },
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
      {
        path: 'login',
        component: LoginAdmin
      }
    ]
  }
];
