import { Routes } from '@angular/router';
import { Dashboard } from './dashboard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: Dashboard,
    children: [
      {
        path: '',
        redirectTo: '/admin/dashboard/index',
        pathMatch: 'full'
      },
      {
        path: 'index',
        loadComponent: () => import('./dashboard-index/dashboard-index').then(m => m.DashboardIndex)
      },
    ]
  }
];
