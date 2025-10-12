import { Routes } from '@angular/router';

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./registration-create/registration-create').then(m => m.RegistrationCreate)
  }
];
