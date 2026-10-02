import { Routes } from '@angular/router';

export const CARE_ROUTES: Routes = [
  { path: '', redirectTo: 'patients', pathMatch: 'full' },
  { path: 'patients', loadComponent: () => import('./patient-records/patient-records').then(m => m.PatientRecords) },
  { path: 'patients/:id', loadComponent: () => import('./patient-record/patient-record').then(m => m.PatientRecordPage) },
  { path: 'queue', loadComponent: () => import('./queue/queue').then(m => m.TreatmentQueue) },
  { path: 'check-in', loadComponent: () => import('./check-in/check-in').then(m => m.PatientCheckIn) },
];
