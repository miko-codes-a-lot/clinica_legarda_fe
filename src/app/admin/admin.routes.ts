import { Routes } from '@angular/router';
import { Admin } from './admin';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: Admin,
    children: [
      {
        path: '',
        redirectTo: '/admin/user',
        pathMatch: 'full'
      },
      {
        path: 'user',
        loadChildren: () => import('./user/user.routes').then(m => m.USER_ROUTES)
      },
      {
        path: 'clinic',
        loadChildren: () => import('./clinic/clinic.routes').then(m => m.CLINIC_ROUTES)
      }
    ]
  }
];
