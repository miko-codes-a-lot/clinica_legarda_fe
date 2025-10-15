import { Routes } from '@angular/router';
import { UserSettings } from './user-settings';

export const USER_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: UserSettings,
    children: [
      {
        path: '',
        redirectTo: '/app/user-settings/index',
        pathMatch: 'full'
      },
      {
        path: 'index',
        loadComponent: () => import('./user-settings-index/user-settings-index').then(m => m.UserSettingsIndex)
      },
      {
        path: 'update',
        loadComponent: () => import('./user-settings-update/user-settings-update').then(m => m.UserSettingsUpdate)
      },
    ]
  }
];
