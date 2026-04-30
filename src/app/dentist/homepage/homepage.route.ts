import { Routes } from '@angular/router';
import { Homepage } from './homepage';

export const HOMEPAGE_ROUTES: Routes = [
  {
    path: '',
    component: Homepage,
    children: [
      {
        path: '',
        redirectTo: '/dentist/homepage/index',
        pathMatch: 'full'
      },
      {
        path: 'index',
        loadComponent: () => import('./homepage-index/homepage-index').then(m => m.HomepageIndex)
      },
    ]
  }
];
