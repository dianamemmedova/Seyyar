import type { Lang, PlaceType } from '@seyyar/shared';

// URL part for each type of place: /en/hotels/..., /en/restaurants/..., /en/places/...
export const PLACE_SECTION: Record<PlaceType, string> = {
  HOTEL: 'hotels',
  RESTAURANT: 'restaurants',
  ATTRACTION: 'places',
};

// routerLink for a place detail page: ['/', 'en', 'hotels', 'test-hotel']
export const placeLink = (lang: Lang, type: PlaceType, slug: string) => [
  '/',
  lang,
  PLACE_SECTION[type],
  slug,
];
