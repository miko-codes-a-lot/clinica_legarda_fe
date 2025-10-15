import { Routes } from '@angular/router';
import { Notification } from './notification';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    component: Notification,
    children: [
      {
        path: '',
        redirectTo: '/dentist/notification/list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./notification-list/notification-list').then(m => m.NotificationList)
      },
      {
        path: 'details/:id',
        loadComponent: () => import('./notification-details/notification-details').then(m => m.NotificationDetails)
      }
    ]
  }
];
