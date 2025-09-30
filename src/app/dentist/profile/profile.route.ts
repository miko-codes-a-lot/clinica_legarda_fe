import { Routes } from '@angular/router';
import { Profile } from './profile';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    component: Profile,
    children: [
      {
        path: '',
        redirectTo: '/dentist/profile/index',
        pathMatch: 'full'
      },
      {
        path: 'index',
        loadComponent: () => import('./profile-index/profile-index').then(m => m.ProfileIndex)
      },
    ]
  }
];
