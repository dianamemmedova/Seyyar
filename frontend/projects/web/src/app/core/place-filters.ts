import type { Params, ParamMap } from '@angular/router';
import type { Lang, PlaceType } from '@seyyar/shared';

export const SORTS = ['recommended', 'rating', 'price_asc', 'price_desc'] as const;
export type Sort = (typeof SORTS)[number];

// Everything the visitor chose on a list page. Lives in the URL:
// /en/hotels?area=old-city,sabail&stars=4,5&amenities=wifi&sort=rating&page=2
export type PlaceFilters = {
  q: string;
  area: string[];
  categories: string[];
  amenities: string[];
  stars: number[];
  priceLevel: number[];
  priceMin: number | null;
  priceMax: number | null;
  openNow: boolean;
  hasDiscount: boolean;
  verifiedOnly: boolean;
  sort: Sort;
  page: number;
  view: 'list' | 'map';
};

// The keys that are real filters (the "Clear all" button removes these)
export const FILTER_KEYS = [
  'q',
  'area',
  'categories',
  'amenities',
  'stars',
  'priceLevel',
  'priceMin',
  'priceMax',
  'openNow',
  'hasDiscount',
  'verifiedOnly',
] as const;

const list = (value: string | null): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

// "4,5,9,x" -> [4, 5] (only whole numbers between min and max)
const numbers = (value: string | null, min: number, max: number): number[] =>
  list(value)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= min && n <= max);

const amount = (value: string | null): number | null => {
  if (value === null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// URL -> filters. Anything broken or unknown in the URL is ignored instead of breaking the page.
export function parseFilters(params: ParamMap): PlaceFilters {
  const q = (params.get('q') ?? '').trim();
  const sort = params.get('sort') as Sort;
  const page = Number(params.get('page'));

  return {
    // The API needs at least 2 characters
    q: q.length >= 2 ? q.slice(0, 100) : '',
    area: list(params.get('area')),
    categories: list(params.get('categories')),
    amenities: list(params.get('amenities')),
    stars: numbers(params.get('stars'), 1, 5),
    priceLevel: numbers(params.get('priceLevel'), 1, 3),
    priceMin: amount(params.get('priceMin')),
    priceMax: amount(params.get('priceMax')),
    openNow: params.get('openNow') === 'true',
    hasDiscount: params.get('hasDiscount') === 'true',
    verifiedOnly: params.get('verifiedOnly') === 'true',
    sort: SORTS.includes(sort) ? sort : 'recommended',
    page: Number.isInteger(page) && page > 1 ? page : 1,
    view: params.get('view') === 'map' ? 'map' : 'list',
  };
}

// Filters -> query of GET /api/places. Empty values are left out.
export function toApiParams(
  filters: PlaceFilters,
  type: PlaceType,
  lang: Lang,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    type,
    lang,
    sort: filters.sort,
    page: filters.page,
    // The map shows more pins at once than the list shows cards
    limit: filters.view === 'map' ? 50 : 12,
  };

  if (filters.q) params['q'] = filters.q;
  if (filters.area.length) params['area'] = filters.area.join(',');
  if (filters.categories.length) params['categories'] = filters.categories.join(',');
  if (filters.amenities.length) params['amenities'] = filters.amenities.join(',');
  if (filters.stars.length) params['stars'] = filters.stars.join(',');
  if (filters.priceLevel.length) params['priceLevel'] = filters.priceLevel.join(',');
  if (filters.priceMin !== null) params['priceMin'] = filters.priceMin;
  if (filters.priceMax !== null) params['priceMax'] = filters.priceMax;
  if (filters.openNow) params['openNow'] = 'true';
  if (filters.hasDiscount) params['hasDiscount'] = 'true';
  if (filters.verifiedOnly) params['verifiedOnly'] = 'true';

  return params;
}

// A change of some filters -> queryParams for router.navigate (with queryParamsHandling: 'merge').
// null removes the key from the URL. Any filter change goes back to page 1.
export function toUrlParams(change: Partial<PlaceFilters>): Params {
  const params: Params = { page: null };

  for (const [key, value] of Object.entries(change)) {
    if (Array.isArray(value)) {
      params[key] = value.length ? value.join(',') : null;
    } else if (typeof value === 'boolean') {
      params[key] = value ? 'true' : null;
    } else if (value === '' || value === null || value === undefined) {
      params[key] = null;
    } else {
      params[key] = String(value);
    }
  }

  // Defaults are not written into the URL
  if (params['sort'] === 'recommended') params['sort'] = null;
  if (params['view'] === 'list') params['view'] = null;
  if (params['page'] === '1') params['page'] = null;

  return params;
}

// Checkbox click: add the value if it is not in the list, remove it if it is
export function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

// How many filters are on (shown on the mobile "Filters (3)" button)
export function countActive(filters: PlaceFilters): number {
  return (
    filters.area.length +
    filters.categories.length +
    filters.amenities.length +
    filters.stars.length +
    filters.priceLevel.length +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0) +
    (filters.openNow ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.q ? 1 : 0)
  );
}
