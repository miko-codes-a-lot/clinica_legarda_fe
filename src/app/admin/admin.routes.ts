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
        loadComponent: () => import('./user/user').then(m => m.User)
      },
      {
        path: 'clinic',
        loadComponent: () => import('./clinic/clinic').then(m => m.Clinic)
      }
    ]
  }
];
