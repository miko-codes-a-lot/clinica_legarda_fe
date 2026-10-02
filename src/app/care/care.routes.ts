import { Routes } from '@angular/router';

export const CARE_ROUTES: Routes = [
  { path: '', redirectTo: 'patients', pathMatch: 'full' },
  { path: 'patients', loadComponent: () => import('./patient-records/patient-records').then(m => m.PatientRecords) },
  { path: 'patients/:id', loadComponent: () => import('./patient-record/patient-record').then(m => m.PatientRecordPage) },
];
