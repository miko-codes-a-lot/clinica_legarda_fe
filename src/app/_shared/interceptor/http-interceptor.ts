import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const reqWithCreds = req.clone({
    url: `${environment.apiUrl}${req.url}`,
    withCredentials: true,
  });
  return next(reqWithCreds);
};
