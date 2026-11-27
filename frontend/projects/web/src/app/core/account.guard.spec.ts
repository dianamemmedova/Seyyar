import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  provideRouter,
  Router,
  UrlTree,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthService } from '@seyyar/shared';
import { accountGuard } from './account.guard';
import { LanguageService } from './language';

const run = (url: string) =>
  TestBed.runInInjectionContext(() =>
    accountGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );

describe('accountGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    });
    TestBed.inject(LanguageService).current.set('az');
  });

  it('sends visitors to the login page in the current language and remembers the page', () => {
    const result = run('/az/account/favorites') as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe(
      '/az/auth/login?returnUrl=%2Faz%2Faccount%2Ffavorites',
    );
  });

  it('lets logged-in users in', () => {
    TestBed.inject(AuthService).login({ email: 'a', password: 'b' }).subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/login')
      .flush({
        data: {
          accessToken: 't',
          user: {
            id: 1,
            email: 'a',
            fullName: 'A',
            phone: null,
            role: 'TOURIST',
            language: 'az',
            currency: 'AZN',
            createdAt: '',
          },
        },
      });

    expect(run('/az/account/requests')).toBe(true);
  });
});
