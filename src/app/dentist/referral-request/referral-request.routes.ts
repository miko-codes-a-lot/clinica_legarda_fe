import { Routes } from '@angular/router';
import { ReferralRequest } from './referral-request';

export const REFERRAL_REQUEST_ROUTES: Routes = [
  {
    path: '',
    component: ReferralRequest,
    children: [
      {
        path: '',
        redirectTo: '/dentist/referral-request/list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./referral-request-list/referral-request-list').then(m => m.ReferralRequestList)
      },
      {
        path: 'details/:id',
        loadComponent: () => import('./referral-request-details/referral-request-details').then(m => m.ReferralRequestDetails)
      },
      {
        path: 'create',
        loadComponent: () => import('./appointment-create/appointment-create').then(m => m.AppointmentCreate)
      },
      {
        path: 'update/:id',
        loadComponent: () => import('./appointment-update/appointment-update').then(m => m.AppointmentUpdate)
      },
    ]
  }
];
