import { Routes } from '@angular/router';
import { User } from './user';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: User,
    children: [
      {
        path: '',
        redirectTo: '/admin/user/list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./user-list/user-list').then(m => m.UserList)
      },
      {
        path: 'details/:id',
        loadComponent: () => import('./user-details/user-details').then(m => m.UserDetails)
      },
      {
        path: 'create',
        loadComponent: () => import('./user-create/user-create').then(m => m.UserCreate)
      },
      {
        path: 'update/:id',
        loadComponent: () => import('./user-update/user-update').then(m => m.UserUpdate)
      },
    ]
  }
];
