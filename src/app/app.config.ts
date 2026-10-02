import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  inject,
  provideAppInitializer
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpInterceptor } from './_shared/interceptor/http-interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ThemeService } from './_shared/service/theme-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => { inject(ThemeService); }),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideNativeDateAdapter(),
    provideHttpClient(
      withInterceptors([httpInterceptor])
    ),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    importProvidersFrom(MatSnackBarModule)
  ]
};
