import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import type { Session } from '../api/api.types';

const session: Session = {
  accessToken: 'access-1',
  user: {
    id: 1,
    email: 'admin@seyyar.test',
    fullName: 'Admin',
    phone: null,
    role: 'ADMIN',
    language: 'en',
    currency: 'AZN',
    createdAt: '2026-11-27T00:00:00.000Z',
  },
};

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('logs in and keeps the user and the token', () => {
    auth.login({ email: 'admin@seyyar.test', password: 'Password123' }).subscribe();

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ data: session });

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.accessToken()).toBe('access-1');
    expect(auth.hasRole('ADMIN')).toBe(true);
    expect(auth.hasRole('TOURIST')).toBe(false);
  });

  it('does not call the API on startup for visitors who never logged in', () => {
    let restored: boolean | undefined;
    auth.restoreSession().subscribe((value) => (restored = value));

    http.expectNone('/api/auth/refresh');
    expect(restored).toBe(false);
  });

  it('restores the session after a reload', () => {
    auth.login({ email: 'a', password: 'b' }).subscribe();
    http.expectOne('/api/auth/login').flush({ data: session });

    // A new page load: memory is empty, only the "was logged in" hint is left
    auth.clearSession();
    localStorage.setItem('seyyar_has_session', '1');

    let restored: boolean | undefined;
    auth.restoreSession().subscribe((value) => (restored = value));
    http.expectOne('/api/auth/refresh').flush({ data: { ...session, accessToken: 'access-2' } });

    expect(restored).toBe(true);
    expect(auth.accessToken()).toBe('access-2');
  });

  it('sends only one refresh request when several callers ask at once', () => {
    const tokens: (string | null)[] = [];
    auth.refresh().subscribe((token) => tokens.push(token));
    auth.refresh().subscribe((token) => tokens.push(token));

    http.expectOne('/api/auth/refresh').flush({ data: session });
    expect(tokens).toEqual(['access-1', 'access-1']);
  });

  it('clears the session when the refresh fails', () => {
    auth.login({ email: 'a', password: 'b' }).subscribe();
    http.expectOne('/api/auth/login').flush({ data: session });

    let token: string | null | undefined;
    auth.refresh().subscribe((value) => (token = value));
    http.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(token).toBeNull();
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('seyyar_has_session')).toBeNull();
  });

  it('logs out even when the server does not answer', () => {
    auth.login({ email: 'a', password: 'b' }).subscribe();
    http.expectOne('/api/auth/login').flush({ data: session });

    auth.logout().subscribe();
    http.expectOne('/api/auth/logout').error(new ProgressEvent('error'));

    expect(auth.isLoggedIn()).toBe(false);
  });
});
