import { Routes } from '@angular/router';
import { Admin } from './admin';
import { LoginAdmin } from './login-admin/login-admin';
import { AuthGuard } from '../_shared/guard/auth-guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: Admin,
    children: [
      {
        path: '',
        redirectTo: '/admin/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        canActivate: [AuthGuard],
        loadChildren: () => import('./dashboard/dashboard.route').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'user',
        canActivate: [AuthGuard],
        loadChildren: () => import('./user/user.routes').then(m => m.USER_ROUTES)
      },
      {
        path: 'clinic',
        canActivate: [AuthGuard],
        loadChildren: () => import('./clinic/clinic.routes').then(m => m.CLINIC_ROUTES)
      },
      // {
      //   path: 'branch',
      // canActivate: [AuthGuard],
      //   loadChildren: () => import('./branch/branch.routes').then(m => m.BRANCH_ROUTES)
      // },
      {
        path: 'service',
        canActivate: [AuthGuard],
        loadChildren: () => import('./dental-service/dental-service.routes').then(m => m.DENTAL_SERVICE)
      },
      {
        path: 'appointment',
        canActivate: [AuthGuard],
        loadChildren: () => import('./appointment/appointment.routes').then(m => m.APPOINTMENT_ROUTES)
      },
      {
        path: 'notification',
        canActivate: [AuthGuard],
        loadChildren: () => import('./notification/notification.route').then(m => m.NOTIFICATION_ROUTES)
      },
      {
        path: 'login',
        component: LoginAdmin
      }
    ]
  }
];
