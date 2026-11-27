import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import type { PlaceFilterOptions, PlaceListItem } from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import { PlaceList } from './place-list';

const hotel = (id: number, name: string): PlaceListItem => ({
  id,
  slug: `hotel-${id}`,
  type: 'HOTEL',
  name,
  area: null,
  lat: 40.37,
  lng: 49.83,
  coverPhoto: null,
  priceFrom: 100,
  priceLevel: null,
  stars: 4,
  categories: ['hotel'],
  ratingAvg: 0,
  ratingCount: 0,
  isFeatured: false,
  isVerified: false,
  amenities: [],
  offer: null,
  isOpenNow: null,
  distanceKm: null,
});

const options: PlaceFilterOptions = {
  type: 'HOTEL',
  areas: [{ slug: 'old-city', name: 'Old City' }],
  amenities: [],
  categories: [],
  price: { min: 25, max: 220 },
  stars: [3, 4, 5],
  priceLevels: [],
};

describe('PlaceList page', () => {
  let backend: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            {
              path: 'en/hotels',
              component: PlaceList,
              data: { type: 'HOTEL' },
            },
          ],
          withComponentInputBinding(),
        ),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    TestBed.inject(LanguageService).current.set('en');
    harness = await RouterTestingHarness.create();
  });

  // whenStable() would wait for the new HTTP request, so after a click we only let the
  // router finish the navigation and run change detection
  async function settle() {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  const listRequest = (): TestRequest => backend.expectOne((req) => req.url === '/api/places');

  async function open(url: string) {
    await harness.navigateByUrl(url);
    TestBed.tick();
    backend.expectOne((req) => req.url === '/api/places/filters').flush({ data: options });
  }

  it('sends the filters from the URL to the API and shows the cards', async () => {
    await open('/en/hotels?stars=4,5&area=old-city&sort=rating&page=2');

    const request = listRequest();
    expect(request.request.params.get('type')).toBe('HOTEL');
    expect(request.request.params.get('stars')).toBe('4,5');
    expect(request.request.params.get('area')).toBe('old-city');
    expect(request.request.params.get('sort')).toBe('rating');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({
      data: [hotel(1, 'Sea Hotel'), hotel(2, 'Old Inn')],
      meta: { page: 2, limit: 12, total: 14, totalPages: 2 },
    });
    await harness.fixture.whenStable();

    const page = harness.routeNativeElement!;
    expect(page.querySelectorAll('app-place-card')).toHaveLength(2);
    expect(page.textContent).toContain('Sea Hotel');
    // The area checkbox is ticked because it is in the URL
    const oldCity = page.querySelector<HTMLInputElement>(
      'app-filters-panel input[type=checkbox]:checked',
    );
    expect(oldCity?.parentElement?.textContent).toContain('Old City');
  });

  it('puts a clicked filter into the URL and starts again from page 1', async () => {
    await open('/en/hotels?stars=4&page=3');
    listRequest().flush({
      data: [hotel(1, 'Sea Hotel')],
      meta: { page: 3, limit: 12, total: 30, totalPages: 3 },
    });
    await harness.fixture.whenStable();

    const fiveStars = [...harness.routeNativeElement!.querySelectorAll('button.chip')].find(
      (button) => button.textContent?.trim() === '5★',
    ) as HTMLButtonElement;
    fiveStars.click();
    await settle();

    expect(TestBed.inject(Router).url).toBe('/en/hotels?stars=4,5');
    const next = listRequest();
    expect(next.request.params.get('stars')).toBe('4,5');
    expect(next.request.params.get('page')).toBe('1');
    next.flush({
      data: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
    });
  });

  it('shows an empty message with "Clear all" that removes every filter', async () => {
    await open('/en/hotels?stars=5&openNow=true&sort=rating');
    listRequest().flush({
      data: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
    });
    await harness.fixture.whenStable();

    const page = harness.routeNativeElement!;
    expect(page.textContent).toContain('list.empty');

    const clear = [...page.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'filters.clear',
    ) as HTMLButtonElement;
    clear.click();
    await settle();

    // Filters are gone, the chosen sort order stays
    expect(TestBed.inject(Router).url).toBe('/en/hotels?sort=rating');
    listRequest().flush({
      data: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
    });
  });
});
