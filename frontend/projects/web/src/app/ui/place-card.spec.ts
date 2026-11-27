import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import type { PlaceListItem } from '@seyyar/shared';
import { LanguageService } from '../core/language';
import { PlaceCard } from './place-card';

const base: PlaceListItem = {
  id: 1,
  slug: 'test-hotel',
  type: 'HOTEL',
  name: 'Test Hotel',
  area: { slug: 'old-city', name: 'Old City' },
  lat: 40.36,
  lng: 49.83,
  coverPhoto: 'https://example.com/hotel.jpg',
  priceFrom: 120,
  priceLevel: null,
  stars: 4,
  categories: [],
  ratingAvg: 4.75,
  ratingCount: 12,
  isFeatured: false,
  isVerified: true,
  amenities: [],
  offer: { title: 'Winter deal', discountPercent: 15 },
  isOpenNow: null,
  distanceKm: null,
};

function render(place: Partial<PlaceListItem>) {
  const fixture = TestBed.createComponent(PlaceCard);
  fixture.componentRef.setInput('place', { ...base, ...place });
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('PlaceCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService()],
    });
    TestBed.inject(LanguageService).current.set('ru');
  });

  it('links to the detail page in the current language', () => {
    const card = render({});
    expect(card.querySelector('a')!.getAttribute('href')).toBe('/ru/hotels/test-hotel');
  });

  it('shows the hotel price per night, rating, discount and verified badge', () => {
    const text = render({}).textContent!;
    expect(text).toContain('120 ₼');
    expect(text).toContain('4.8');
    expect(text).toContain('-15%');
    expect(text).toContain('card.verified');
  });

  it('shows ₼₼ for a restaurant and whether it is open', () => {
    const text = render({
      type: 'RESTAURANT',
      slug: 'kitchen',
      priceLevel: 2,
      isOpenNow: true,
    }).textContent!;
    expect(text).toContain('₼₼');
    expect(text).toContain('card.openNow');
  });

  it('shows free entry for a place without a ticket price', () => {
    const card = render({ type: 'ATTRACTION', slug: 'old-city', priceFrom: null });
    expect(card.textContent).toContain('card.free');
    expect(card.querySelector('a')!.getAttribute('href')).toBe('/ru/places/old-city');
  });

  it('hides the rating while there are no reviews', () => {
    expect(render({ ratingCount: 0 }).textContent).not.toContain('4.8');
  });
});
