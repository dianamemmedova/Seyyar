import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import type { PlaceDetail as Detail, PlaceType } from '@seyyar/shared';
import { LanguageService } from '../../core/language';
import { PlaceDetail } from './place-detail';

const detail = (change: Partial<Detail> = {}): Detail => ({
  id: 1,
  slug: 'sea-hotel',
  type: 'HOTEL',
  name: 'Sea Hotel',
  description: 'By the sea.',
  area: { slug: 'sabail', name: 'Sabail' },
  address: 'Neftchilar Ave 1',
  lat: 40.36,
  lng: 49.84,
  contact: {
    phone: '+994 50 123 45 67',
    whatsapp: '+994 50 123 45 67',
    email: null,
    website: null,
  },
  priceFrom: 100,
  priceLevel: null,
  stars: 4,
  categories: ['hotel'],
  ratingAvg: 4.5,
  ratingCount: 2,
  isVerified: true,
  bookingUrl: null,
  officialTicketUrl: null,
  checkInTime: '14:00',
  checkOutTime: '12:00',
  recommendedMinutes: null,
  photos: [],
  amenities: [{ code: 'wifi', name: 'Free Wi-Fi', icon: 'wifi' }],
  openingHours: [],
  isOpenNow: null,
  today: null,
  rooms: [
    {
      id: 7,
      name: 'Family Room',
      description: null,
      sizeM2: 30,
      bedType: null,
      maxGuests: 4,
      pricePerNight: 180,
      freeCancellation: true,
      breakfastIncluded: false,
      photos: [],
    },
  ],
  menu: [],
  tickets: [],
  offers: [],
  ...change,
});

describe('PlaceDetail page', () => {
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
    TestBed.inject(LanguageService).current.set('en');
  });

  // Let the HTTP answer reach the resource and draw the page (whenStable would also wait
  // for the next requests, like the reviews, and time out)
  async function settle() {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  function render(type: PlaceType, slug: string) {
    const fixture = TestBed.createComponent(PlaceDetail);
    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('slug', slug);
    TestBed.tick();
    backend.expectOne((req) => req.url === '/api/places/sea-hotel/nearby').flush({ data: [] });
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('shows the hotel, its rooms with a request link and the contacts', async () => {
    const { fixture, page } = render('HOTEL', 'sea-hotel');
    backend.expectOne('/api/places/sea-hotel?lang=en').flush({ data: detail() });
    await settle();
    backend
      .expectOne((req) => req.url === '/api/places/sea-hotel/reviews')
      .flush({
        data: [],
        meta: {
          page: 1,
          limit: 5,
          total: 0,
          totalPages: 1,
          ratingAvg: 4.5,
          ratingCount: 2,
        },
      });
    await fixture.whenStable();

    expect(page.querySelector('h1')?.textContent).toContain('Sea Hotel');
    expect(page.textContent).toContain('Family Room');
    const request = page.querySelector<HTMLAnchorElement>('app-rooms-list a');
    expect(request?.getAttribute('href')).toBe('/en/hotels/sea-hotel/request?room=7');
    expect(page.querySelector('a[href="https://wa.me/994501234567"]')).not.toBeNull();
    expect(page.querySelector('a[href="tel:+994 50 123 45 67"]')).not.toBeNull();
  });

  it('shows the not-found page for an unknown slug', async () => {
    const { fixture, page } = render('HOTEL', 'sea-hotel');
    backend
      .expectOne('/api/places/sea-hotel?lang=en')
      .flush({ error: { code: 'NOT_FOUND' } }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(page.querySelector('app-not-found')).not.toBeNull();
  });

  it('moves a place opened under the wrong section to its own address', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    render('RESTAURANT', 'sea-hotel');
    backend.expectOne('/api/places/sea-hotel?lang=en').flush({ data: detail() });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/', 'en', 'hotels', 'sea-hotel'], {
      replaceUrl: true,
    });
  });
});
