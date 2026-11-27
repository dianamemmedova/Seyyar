import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { Role } from '../api/api.types';
import { AuthService } from './auth.service';

/**
 * Lets the user in only when logged in (and, if roles are given, with one of those roles).
 * Otherwise sends them to the login page and remembers where they wanted to go.
 *
 *   { path: 'account', canActivate: [requireLogin({ loginUrl: '/en/login' })] }
 *   { path: '', canActivate: [requireLogin({ loginUrl: '/login', roles: ['ADMIN'] })] }
 */
export function requireLogin(options: { loginUrl: string; roles?: Role[] }): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const allowed = options.roles ? auth.hasRole(...options.roles) : auth.isLoggedIn();
    if (allowed) return true;

    return router.createUrlTree([options.loginUrl], { queryParams: { returnUrl: state.url } });
  };
}
