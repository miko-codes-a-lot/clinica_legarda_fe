import { Routes } from '@angular/router';
import { Appointment } from './appointment';

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    component: Appointment,
    children: [
      {
        path: '',
        redirectTo: '/admin/appointment/list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./appointment-list/appointment-list').then(m => m.AppointmentList)
      },
      {
        path: 'details/:id',
        loadComponent: () => import('./appointment-details/appointment-details').then(m => m.AppointmentDetails)
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
