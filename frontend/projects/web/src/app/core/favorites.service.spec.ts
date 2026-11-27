import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '@seyyar/shared';
import { FavoritesService } from './favorites.service';

const session = {
  accessToken: 't',
  user: {
    id: 1,
    email: 'a',
    fullName: 'A',
    phone: null,
    role: 'TOURIST',
    language: 'en',
    currency: 'AZN',
    createdAt: '',
  },
};

describe('FavoritesService', () => {
  let backend: HttpTestingController;
  let favorites: FavoritesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
    favorites = TestBed.inject(FavoritesService);

    // Log in: the service loads the saved slugs by itself
    TestBed.inject(AuthService).login({ email: 'a', password: 'b' }).subscribe();
    backend.expectOne('/api/auth/login').flush({ data: session });
    TestBed.tick();
    backend.expectOne('/api/favorites/slugs').flush({ data: ['old-city'] });
  });

  it('knows the saved places after login', () => {
    expect(favorites.loaded()).toBe(true);
    expect(favorites.isFavorite('old-city')).toBe(true);
    expect(favorites.isFavorite('sea-hotel')).toBe(false);
  });

  it('fills the heart at once and then saves it', () => {
    favorites.toggle('sea-hotel');
    expect(favorites.isFavorite('sea-hotel')).toBe(true);

    const req = backend.expectOne('/api/favorites/sea-hotel');
    expect(req.request.method).toBe('PUT');
    req.flush({ data: { slug: 'sea-hotel', isFavorite: true } });
  });

  it('puts the heart back when the API fails', () => {
    favorites.toggle('old-city');
    expect(favorites.isFavorite('old-city')).toBe(false);

    const req = backend.expectOne('/api/favorites/old-city');
    expect(req.request.method).toBe('DELETE');
    req.flush({}, { status: 500, statusText: 'Error' });

    expect(favorites.isFavorite('old-city')).toBe(true);
  });

  it('forgets everything after logout', () => {
    TestBed.inject(AuthService).clearSession();
    TestBed.tick();
    expect(favorites.isFavorite('old-city')).toBe(false);
    expect(favorites.loaded()).toBe(false);
  });
});
