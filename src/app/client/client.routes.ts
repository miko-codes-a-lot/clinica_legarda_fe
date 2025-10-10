import { Routes } from '@angular/router';
import { Client } from './client';
import { Home } from './home/home';
import { LoginPatient } from './login-patient/login-patient';
import { About } from './about/about';
import { ContactUs } from './contact-us/contact-us';
import { Appointment } from './appointment/appointment';
import { Faq } from './faq/faq';
import { DentalService } from './dental-service/dental-service';

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
        component: Appointment,
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
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then(m => m.Profile),
      },
      {
        path: 'my-appointment',
        loadComponent: () => import('./my-appointment/my-appointment').then(m => m.MyAppointment),
      },
      {
        path: 'my-appointment/details/:id',
        loadComponent: () => import('./appointment-details/appointment-details').then(m => m.AppointmentDetails),
      },
      {
        path: 'login',
        component: LoginPatient,
      }
    ]
  }
];
