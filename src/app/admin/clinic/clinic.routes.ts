import { Routes } from '@angular/router';
import { Clinic } from './clinic';
import { AuthGuard } from '../../_shared/guard/auth-guard';

export const CLINIC_ROUTES: Routes = [
  {
    path: '',
    component: Clinic,
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./clinic-list/clinic-list').then(m => m.ClinicList)
      },
      {
        path: 'details/:id',
        loadComponent: () => import('./clinic-details/clinic-details').then(m => m.ClinicDetails)
      },
      {
        path: 'create',
        canActivate: [AuthGuard],
        data: { role: 'super-admin' },
        loadComponent: () => import('./clinic-create/clinic-create').then(m => m.ClinicCreate)
      },
      {
        path: 'update/:id',
        canActivate: [AuthGuard],
        data: { role: 'super-admin' },
        loadComponent: () => import('./clinic-update/clinic-update').then(m => m.ClinicUpdate)
      },
    ]
  }
];
