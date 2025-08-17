import { Routes } from '@angular/router';
import { Notification } from './notification';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    component: Notification,
    children: [
      {
        path: '',
        redirectTo: '/admin/notification/list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./notification-list/notification-list').then(m => m.NotificationList)
      },
    ]
  }
];
