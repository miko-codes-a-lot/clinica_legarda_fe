import { Routes } from '@angular/router';
import { DentalService } from './dental-service';

export const DENTAL_SERVICE: Routes = [
  {
    path: '',
    component: DentalService,
    children: [
      {
        path: '',
        redirectTo: '/admin/service/list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./dental-service-list/dental-service-list').then(m => m.DentalServiceList)
      },
      {
        path: 'details/:id',
        loadComponent: () => import('./dental-service-details/dental-service-details').then(m => m.DentalServiceDetails)
      },
      {
        path: 'create',
        loadComponent: () => import('./dental-service-create/dental-service-create').then(m => m.DentalServiceCreate)
      },
      {
        path: 'update/:id',
        loadComponent: () => import('./dental-service-update/dental-service-update').then(m => m.DentalServiceUpdate)
      },
    ]
  }
];
