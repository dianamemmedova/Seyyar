import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import type { HomeData, PlaceListItem } from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import { Home } from './home';

const place = (id: number, name: string, type: PlaceListItem['type']): PlaceListItem => ({
  id,
  slug: `place-${id}`,
  type,
  name,
  area: null,
  lat: 0,
  lng: 0,
  coverPhoto: null,
  priceFrom: 100,
  priceLevel: 2,
  stars: null,
  categories: [],
  ratingAvg: 0,
  ratingCount: 0,
  isFeatured: false,
  isVerified: false,
  amenities: [],
  offer: null,
  isOpenNow: null,
  distanceKm: null,
});

const data: HomeData = {
  recommendedHotels: [place(1, 'Sea Hotel', 'HOTEL')],
  whereToEat: [place(2, 'Plov House', 'RESTAURANT')],
  popularPlaces: [place(3, 'Old City', 'ATTRACTION')],
  offers: [],
  comingSoonRegions: [{ slug: 'gabala', name: 'Gabala' }],
};

describe('Home', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    TestBed.inject(LanguageService).current.set('az');
  });

  // whenStable() would wait for the HTTP request, so the first render only runs change detection
  function render() {
    const fixture = TestBed.createComponent(Home);
    TestBed.tick();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('loads the home blocks in the current language and shows the cards', async () => {
    const { fixture, page } = render();

    backend.expectOne('/api/home?lang=az').flush({ data });
    await fixture.whenStable();

    expect(page.textContent).toContain('Sea Hotel');
    expect(page.textContent).toContain('Plov House');
    expect(page.textContent).toContain('Old City');
    expect(page.textContent).toContain('Gabala.');
    // An empty block (offers) is not shown at all
    expect(page.textContent).not.toContain('home.sections.offers.title');
  });

  it('offers a retry when the API fails', async () => {
    const { fixture, page } = render();

    backend.expectOne('/api/home?lang=az').flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(page.textContent).toContain('common.loadError');

    page.querySelector<HTMLButtonElement>('button[type=button]')!.click();
    TestBed.tick();
    backend.expectOne('/api/home?lang=az').flush({ data });
    await fixture.whenStable();
    expect(page.textContent).toContain('Sea Hotel');
  });

  it('subscribes to the regions newsletter', async () => {
    const { fixture, page } = render();
    backend.expectOne('/api/home?lang=az').flush({ data });
    await fixture.whenStable();

    const input = page.querySelector<HTMLInputElement>('#newsletter-email')!;
    input.value = 'fan@example.com';
    input.dispatchEvent(new Event('input'));
    input.closest('form')!.dispatchEvent(new Event('submit'));

    const req = backend.expectOne('/api/subscribe');
    expect(req.request.body).toEqual({ email: 'fan@example.com', interest: 'REGIONS' });
    req.flush({ data: { message: 'ok' } }, { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(page.textContent).toContain('home.regions.done');
  });

  it('does not send an invalid email', async () => {
    const { fixture, page } = render();
    backend.expectOne('/api/home?lang=az').flush({ data });
    await fixture.whenStable();

    const input = page.querySelector<HTMLInputElement>('#newsletter-email')!;
    input.value = 'not-an-email';
    input.dispatchEvent(new Event('input'));
    input.closest('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    backend.expectNone('/api/subscribe');
    expect(page.textContent).toContain('home.regions.invalid');
  });

  it('searches in the chosen category', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const { fixture, page } = render();
    backend.expectOne('/api/home?lang=az').flush({ data });
    await fixture.whenStable();

    const input = page.querySelector<HTMLInputElement>('input[name=q]')!;
    input.value = '  plov ';
    input.dispatchEvent(new Event('input'));
    const select = page.querySelector<HTMLSelectElement>('select[name=type]')!;
    select.value = 'restaurants';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    input.closest('form')!.dispatchEvent(new Event('submit'));

    expect(navigate).toHaveBeenCalledWith(['/', 'az', 'restaurants'], {
      queryParams: { q: 'plov' },
    });
  });
});
