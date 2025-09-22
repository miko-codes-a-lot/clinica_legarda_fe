import { Routes } from '@angular/router';

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./appointment-create/appointment-create').then(m => m.AppointmentCreate)
  }
];
