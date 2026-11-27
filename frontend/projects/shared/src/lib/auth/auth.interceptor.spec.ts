import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const user = {
  id: 1,
  email: 'a@seyyar.test',
  fullName: 'A',
  phone: null,
  role: 'TOURIST' as const,
  language: 'en',
  currency: 'AZN',
  createdAt: '',
};

const expired = {
  error: { code: 'TOKEN_EXPIRED', message: 'Access token expired', requestId: 'x' },
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  // Puts the service into "logged in with this token" state
  function loginWith(token: string) {
    auth.login({ email: 'a', password: 'b' }).subscribe();
    backend.expectOne('/api/auth/login').flush({ data: { user, accessToken: token } });
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => backend.verify());

  it('adds the access token to API requests', () => {
    loginWith('token-1');
    http.get('/api/favorites').subscribe();

    const req = backend.expectOne('/api/favorites');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-1');
    req.flush({ data: [] });
  });

  it('never sends the token to other websites', () => {
    loginWith('token-1');
    http.get('https://tile.openstreetmap.org/1/1/1.png').subscribe();

    const req = backend.expectOne('https://tile.openstreetmap.org/1/1/1.png');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush('');
  });

  it('sends no header when nobody is logged in', () => {
    http.get('/api/places').subscribe();

    const req = backend.expectOne('/api/places');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ data: [] });
  });

  it('gets a new token and repeats the request when the token expired', () => {
    loginWith('old-token');
    let result: unknown;
    http.get('/api/favorites').subscribe((body) => (result = body));

    backend.expectOne('/api/favorites').flush(expired, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush({ data: { user, accessToken: 'new-token' } });

    const retry = backend.expectOne('/api/favorites');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({ data: ['ok'] });

    expect(result).toEqual({ data: ['ok'] });
  });

  it('refreshes once for several requests that expired together', () => {
    loginWith('old-token');
    http.get('/api/favorites').subscribe();
    http.get('/api/requests/my').subscribe();

    backend.expectOne('/api/favorites').flush(expired, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne('/api/requests/my')
      .flush(expired, { status: 401, statusText: 'Unauthorized' });

    // Only ONE refresh request for both
    backend.expectOne('/api/auth/refresh').flush({ data: { user, accessToken: 'new-token' } });

    backend.expectOne('/api/favorites').flush({ data: [] });
    backend.expectOne('/api/requests/my').flush({ data: [] });
  });

  it('gives up and passes the error on when the refresh fails', () => {
    loginWith('old-token');
    let status: number | undefined;
    http.get('/api/favorites').subscribe({ error: (err) => (status = err.status) });

    backend.expectOne('/api/favorites').flush(expired, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('does not refresh for other 401 errors', () => {
    loginWith('token-1');
    http.get('/api/favorites').subscribe({ error: () => undefined });

    backend
      .expectOne('/api/favorites')
      .flush(
        { error: { code: 'INVALID_TOKEN', message: '', requestId: 'x' } },
        { status: 401, statusText: 'Unauthorized' },
      );
    backend.expectNone('/api/auth/refresh');
  });
});
