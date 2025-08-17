import { Routes } from '@angular/router';
import { Admin } from './admin';

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
        loadChildren: () => import('./dashboard/dashboard.route').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'user',
        loadChildren: () => import('./user/user.routes').then(m => m.USER_ROUTES)
      },
      {
        path: 'clinic',
        loadChildren: () => import('./clinic/clinic.routes').then(m => m.CLINIC_ROUTES)
      },
      // {
      //   path: 'branch',
      //   loadChildren: () => import('./branch/branch.routes').then(m => m.BRANCH_ROUTES)
      // },
      {
        path: 'service',
        loadChildren: () => import('./dental-service/dental-service.routes').then(m => m.DENTAL_SERVICE)
      },
      {
        path: 'appointment',
        loadChildren: () => import('./appointment/appointment.routes').then(m => m.APPOINTMENT_ROUTES)
      },
      {
        path: 'notification',
        loadChildren: () => import('./notification/notification.route').then(m => m.NOTIFICATION_ROUTES)
      },
    ]
  }
];
