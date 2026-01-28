import { Routes } from '@angular/router';
import { Reason } from './reason';

export const REASON_ROUTES: Routes = [
  {
    path: '',
    component: Reason,
    children: [
      {
        path: '',
        redirectTo: '/admin/reason/list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./reason-list/reason-list').then(m => m.ReasonList)
      },
      {
        path: 'details/:id',
        loadComponent: () => import('./reason-details/reason-details').then(m => m.ReasonDetails)
      },
      {
        path: 'create',
        loadComponent: () => import('./reason-create/reason-create').then(m => m.ReasonCreate)
      },
      {
        path: 'update/:id',
        loadComponent: () => import('./reason-update/reason-update').then(m => m.ReasonUpdate)
      },
    ]
  }
];
