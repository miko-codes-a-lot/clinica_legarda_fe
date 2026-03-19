import { Routes } from '@angular/router';
import { SuperAdmin } from './super-admin';
import { AuthGuard } from '../_shared/guard/auth-guard';

export const SUPER_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: SuperAdmin,
    children: [
      {
        path: '',
        redirectTo: '/super-admin/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        canActivate: [AuthGuard],
        data: { role: 'super-admin' },
        loadChildren: () => import('./dashboard/dashboard.route').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'user',
        canActivate: [AuthGuard],
        data: { role: 'super-admin' },
        loadChildren: () => import('./user/user.routes').then(m => m.USER_ROUTES)
      },
      {
        path: 'appointment',
        canActivate: [AuthGuard],
        data: { role: 'super-admin' },
        loadChildren: () => import('./appointment/appointment.routes').then(m => m.APPOINTMENT_ROUTES)
      },
    ]
  }
];
