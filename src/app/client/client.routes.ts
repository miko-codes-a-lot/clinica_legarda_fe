import { Routes } from '@angular/router';
import { Client } from './client';
import { Home } from './home/home';
import { LoginPatient } from './login-patient/login-patient';
import { About } from './about/about';
import { ContactUs } from './contact-us/contact-us';
import { Faq } from './faq/faq';
import { DentalService } from './dental-service/dental-service';
import { AuthGuard } from '../_shared/guard/auth-guard';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: Client,
    children: [
      {
        path: '',
        redirectTo: '/app/home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        component: Home,
      },
      {
        path: 'service',
        component: DentalService,
      },
      {
        path: 'appointment',
        loadComponent: () => import('./appointment/appointment-create/appointment-create')
          .then(m => m.AppointmentCreate),
      },
      {
        path: 'registration',
        loadComponent: () => import('./registration/registration-create/registration-create')
          .then(m => m.RegistrationCreate),
      },
      {
        path: 'about-us',
        component: About,
      },
      {
        path: 'contact-us',
        component: ContactUs,
      },
      {
        path: 'faq',
        component: Faq,
      },
      {
        path: 'dashboard',
        canActivate: [AuthGuard],
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'profile',
        canActivate: [AuthGuard],
        loadComponent: () => import('./profile/profile').then(m => m.Profile),
      },
      {
        path: 'my-appointment',
        canActivate: [AuthGuard],
        loadComponent: () => import('./my-appointment/my-appointment').then(m => m.MyAppointment),
      },
      {
        path: 'my-appointment/details/:id',
        canActivate: [AuthGuard],
        loadComponent: () => import('./appointment-details/appointment-details').then(m => m.AppointmentDetails),
      },
      {
        path: 'user-settings',
        canActivate: [AuthGuard],
        loadChildren: () => import('./user-settings/user-settings.route').then(m => m.USER_SETTINGS_ROUTES)
      },
      {
        path: 'login',
        component: LoginPatient,
      }
    ]
  }
];
