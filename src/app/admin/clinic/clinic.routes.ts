import { Routes } from '@angular/router';
import { Clinic } from './clinic';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: Clinic,
    children: [
      {
        path: '',
        redirectTo: '/admin/user/list',
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
        loadComponent: () => import('./clinic-create/clinic-create').then(m => m.ClinicCreate)
      },
      {
        path: 'update/:id',
        loadComponent: () => import('./clinic-update/clinic-update').then(m => m.ClinicUpdate)
      },
    ]
  }
];
