import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDatabase } from '../helpers/db';
import { createFixtures } from '../helpers/fixtures';

beforeAll(async () => {
  await resetDatabase();
  await createFixtures();
});

const slugs = (res: request.Response) => res.body.data.map((place: { slug: string }) => place.slug);

describe('GET /api/home', () => {
  it('returns the home page blocks', async () => {
    const res = await request(app).get('/api/home');

    expect(res.status).toBe(200);
    expect(res.body.data.recommendedHotels.map((p: { slug: string }) => p.slug)).toEqual([
      'test-hotel', // featured comes first
      'sea-hotel',
    ]);
    expect(res.body.data.whereToEat).toHaveLength(2);
    expect(res.body.data.popularPlaces).toHaveLength(1);
    expect(res.body.data.offers.map((p: { slug: string }) => p.slug)).toEqual(['test-hotel']);
    expect(res.body.data.comingSoonRegions).toEqual([{ slug: 'gabala', name: 'Gabala' }]);
  });
});

describe('GET /api/places', () => {
  it('lists only published places', async () => {
    const res = await request(app).get('/api/places');

    expect(res.status).toBe(200);
    expect(slugs(res)).not.toContain('draft-hotel');
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 5, totalPages: 1 });
  });

  it('filters by type', async () => {
    const res = await request(app).get('/api/places?type=restaurant');
    expect(slugs(res).sort()).toEqual(['late-bar', 'test-restaurant']);
  });

  it('returns the requested language', async () => {
    const res = await request(app).get('/api/places?type=hotel&lang=az');
    expect(res.body.data.find((p: { slug: string }) => p.slug === 'test-hotel').name).toBe(
      'Test Otel',
    );
  });

  it('searches by name in every language', async () => {
    const byEnglish = await request(app).get('/api/places?q=test hot');
    const byRussian = await request(app).get('/api/places?q=Тест');
    expect(slugs(byEnglish)).toEqual(['test-hotel']);
    expect(slugs(byRussian)).toEqual(['test-hotel']);
  });

  it.each([
    ['stars=5', ['sea-hotel']],
    ['area=seaside&type=hotel', ['sea-hotel']],
    ['amenities=wifi,parking', ['test-hotel']],
    ['priceMin=200', ['sea-hotel']],
    ['hasDiscount=true', ['test-hotel']],
    ['verifiedOnly=true', ['sea-hotel']],
    ['categories=museum', ['test-museum']],
  ])('filters with %s', async (query, expected) => {
    const res = await request(app).get(`/api/places?${query}`);
    expect(slugs(res)).toEqual(expected);
  });

  it('sorts by price and by rating', async () => {
    const cheap = await request(app).get('/api/places?type=hotel&sort=price_asc');
    const rated = await request(app).get('/api/places?type=hotel&sort=rating');
    expect(slugs(cheap)).toEqual(['test-hotel', 'sea-hotel']);
    expect(slugs(rated)).toEqual(['sea-hotel', 'test-hotel']);
  });

  it('sorts by distance and shows it', async () => {
    // Right next to the museum
    const res = await request(app).get('/api/places?sort=nearest&lat=40.3665&lng=49.8365');
    expect(slugs(res)[0]).toBe('test-museum');
    expect(res.body.data[0].distanceKm).toBe(0);
  });

  it('paginates', async () => {
    const res = await request(app).get('/api/places?limit=2&page=3');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 3, limit: 2, total: 5, totalPages: 3 });
  });

  it('rejects wrong filter values', async () => {
    const res = await request(app).get('/api/places?stars=9');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/places/map', () => {
  it('returns light points for the map', async () => {
    const res = await request(app).get('/api/places/map?type=hotel');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(Object.keys(res.body.data[0]).sort()).toEqual(
      ['id', 'lat', 'lng', 'name', 'priceFrom', 'slug', 'type'].sort(),
    );
  });

  it('limits points to the visible map area', async () => {
    // Small box around Sea Hotel only
    const res = await request(app).get('/api/places/map?bbox=49.849,40.359,49.851,40.361');
    expect(slugs(res)).toEqual(['sea-hotel']);
  });
});

describe('GET /api/places/filters', () => {
  it('returns the options for the hotel filters', async () => {
    const res = await request(app).get('/api/places/filters?type=hotel');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      type: 'HOTEL',
      stars: [4, 5],
      price: { min: 100, max: 250 },
    });
    expect(res.body.data.amenities).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'wifi', count: 2 })]),
    );
  });

  it('needs a type', async () => {
    const res = await request(app).get('/api/places/filters');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/places/:slug', () => {
  it('returns everything about a hotel', async () => {
    const res = await request(app).get('/api/places/test-hotel');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ slug: 'test-hotel', type: 'HOTEL', stars: 4 });
    // The unavailable room is hidden
    expect(res.body.data.rooms).toHaveLength(2);
  });

  it('returns the menu of a restaurant', async () => {
    const res = await request(app).get('/api/places/test-restaurant');
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data)).toContain('Plov');
  });

  it('hides drafts and unknown slugs', async () => {
    expect((await request(app).get('/api/places/draft-hotel')).status).toBe(404);
    expect((await request(app).get('/api/places/nope')).status).toBe(404);
  });
});

describe('GET /api/places/:slug/nearby', () => {
  it('lists other places, closest first, without the place itself', async () => {
    const res = await request(app).get('/api/places/test-museum/nearby');

    expect(slugs(res)).not.toContain('test-museum');
    expect(slugs(res)[0]).toBe('test-hotel');
    const distances = res.body.data.map((p: { distanceKm: number }) => p.distanceKm);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });
});

describe('GET /api/places/:slug/reviews', () => {
  it('returns an empty list with the rating summary', async () => {
    const res = await request(app).get('/api/places/sea-hotel/reviews');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta).toMatchObject({ total: 0, ratingAvg: 4.8, ratingCount: 10 });
  });
});
