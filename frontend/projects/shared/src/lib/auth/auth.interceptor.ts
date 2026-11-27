import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api-config';
import { AuthService } from './auth.service';

/**
 * For every request to our API:
 * 1. adds "Authorization: Bearer <access token>" when the user is logged in;
 * 2. when the API answers 401 TOKEN_EXPIRED, gets a new token once and repeats the request.
 * The user never notices that the 15-minute access token expired.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const api = inject(API_BASE_URL);

  if (!req.url.startsWith(api)) {
    return next(req);
  }

  const withToken = (request: HttpRequest<unknown>, token: string | null) =>
    token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  // Login, refresh, logout... are never retried (that would loop)
  const isAuthCall = req.url.startsWith(`${api}/auth/`) && !req.url.endsWith('/auth/me');

  return next(withToken(req, auth.accessToken())).pipe(
    catchError((error: unknown) => {
      const expired =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        error.error?.error?.code === 'TOKEN_EXPIRED';

      if (!expired || isAuthCall) {
        return throwError(() => error);
      }

      return auth
        .refresh()
        .pipe(
          switchMap((token) => (token ? next(withToken(req, token)) : throwError(() => error))),
        );
    }),
  );
};
