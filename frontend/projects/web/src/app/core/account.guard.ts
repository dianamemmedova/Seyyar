import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@seyyar/shared';
import { LanguageService } from './language';

// /en/account/... is only for logged-in users; others go to /en/auth/login?returnUrl=...
export const accountGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isLoggedIn()) return true;

  const lang = inject(LanguageService).current();
  return inject(Router).createUrlTree(['/', lang, 'auth', 'login'], {
    queryParams: { returnUrl: state.url },
  });
};
