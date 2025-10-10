import { Routes } from '@angular/router';
import { Branch } from './branch';

export const BRANCH_ROUTES: Routes = [
  {
    path: '',
    component: Branch,
    children: [
      {
        path: '',
        redirectTo: '/admin/branch/list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./branch-list/branch-list').then(m => m.BranchList)
      },
      {
        path: 'details/:id',
        loadComponent: () => import('./branch-details/branch-details').then(m => m.BranchDetails)
      },
      {
        path: 'create',
        loadComponent: () => import('./branch-create/branch-create').then(m => m.BranchCreate)
      },
      {
        path: 'update/:id',
        loadComponent: () => import('./branch-update/branch-update').then(m => m.BranchUpdate)
      },
    ]
  }
];
