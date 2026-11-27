import { convertToParamMap } from '@angular/router';
import { countActive, parseFilters, toApiParams, toggle, toUrlParams } from './place-filters';

const parse = (query: Record<string, string>) => parseFilters(convertToParamMap(query));

describe('place filters', () => {
  it('reads the filters from the URL', () => {
    const filters = parse({
      area: 'old-city,sabail',
      stars: '4,5',
      priceMax: '150',
      openNow: 'true',
      sort: 'rating',
      page: '2',
      view: 'map',
    });

    expect(filters).toMatchObject({
      area: ['old-city', 'sabail'],
      stars: [4, 5],
      priceMin: null,
      priceMax: 150,
      openNow: true,
      hasDiscount: false,
      sort: 'rating',
      page: 2,
      view: 'map',
    });
  });

  it('ignores broken values instead of breaking the page', () => {
    const filters = parse({
      q: 'a',
      stars: '9,x,4',
      priceLevel: '0,2',
      priceMin: '-5',
      sort: 'hacked',
      page: 'abc',
      view: 'grid',
    });

    expect(filters).toMatchObject({
      q: '',
      stars: [4],
      priceLevel: [2],
      priceMin: null,
      sort: 'recommended',
      page: 1,
      view: 'list',
    });
  });

  it('builds the API query without empty filters', () => {
    const filters = parse({ stars: '5', hasDiscount: 'true' });

    expect(toApiParams(filters, 'HOTEL', 'ru')).toEqual({
      type: 'HOTEL',
      lang: 'ru',
      sort: 'recommended',
      page: 1,
      limit: 12,
      stars: '5',
      hasDiscount: 'true',
    });
    // The map shows more places at once
    expect(toApiParams({ ...filters, view: 'map' }, 'HOTEL', 'ru')['limit']).toBe(50);
  });

  it('turns a change into URL params and goes back to page 1', () => {
    expect(toUrlParams({ stars: [4, 5], openNow: false, sort: 'recommended' })).toEqual({
      page: null,
      stars: '4,5',
      openNow: null,
      sort: null,
    });
    expect(toUrlParams({ area: [], priceMax: 100 })).toEqual({
      page: null,
      area: null,
      priceMax: '100',
    });
  });

  it('toggles a value and counts active filters', () => {
    expect(toggle([4, 5], 5)).toEqual([4]);
    expect(toggle([4], 5)).toEqual([4, 5]);
    expect(
      countActive(parse({ area: 'a,b', priceMin: '10', priceMax: '50', openNow: 'true' })),
    ).toBe(4);
  });
});
