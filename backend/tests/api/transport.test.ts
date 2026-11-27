import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDatabase } from '../helpers/db';
import { createFixtures } from '../helpers/fixtures';

beforeAll(async () => {
  await resetDatabase();
  await createFixtures();
});

const slugs = (items: { slug: string }[]) => items.map((item) => item.slug);

describe('GET /api/routes', () => {
  it('lists routes of active regions, popular first', async () => {
    const res = await request(app).get('/api/routes');

    expect(res.status).toBe(200);
    expect(slugs(res.body.data)).toEqual([
      'airport-center-taxi',
      'airport-center-bus',
      'center-bus-station-metro',
    ]);
    expect(slugs(res.body.data)).not.toContain('gabala-route');
  });

  it('filters by start, destination and mode', async () => {
    const res = await request(app).get('/api/routes?from=airport&to=city-center&mode=taxi');
    expect(slugs(res.body.data)).toEqual(['airport-center-taxi']);
  });

  it('translates labels and tags', async () => {
    const res = await request(app).get('/api/routes?from=airport&mode=taxi&lang=az');
    expect(res.body.data[0]).toMatchObject({
      from: { key: 'airport', label: 'Airport (az)' },
      tags: ['24/7 (az)'],
    });
  });
});

describe('GET /api/routes/locations', () => {
  it('returns every start and destination once, sorted by name', async () => {
    const res = await request(app).get('/api/routes/locations');
    expect(res.body.data).toEqual([
      { key: 'airport', label: 'Airport' },
      { key: 'bus-station', label: 'Bus station' },
      { key: 'city-center', label: 'City center' },
    ]);
  });
});

describe('GET /api/routes/:slug', () => {
  it('returns the route with its steps in order', async () => {
    const res = await request(app).get('/api/routes/airport-center-bus');

    expect(res.status).toBe(200);
    expect(res.body.data.steps.map((step: { mode: string }) => step.mode)).toEqual([
      'WALK',
      'AIRPORT_EXPRESS',
    ]);
  });

  it('hides routes of inactive regions', async () => {
    expect((await request(app).get('/api/routes/gabala-route')).status).toBe(404);
  });
});

describe('GET /api/routes/plan', () => {
  it('compares direct options for a group', async () => {
    const res = await request(app).get('/api/routes/plan?from=airport&to=city-center&people=3');

    expect(res.status).toBe(200);
    expect(res.body.data.from).toEqual({ key: 'airport', label: 'Airport' });

    const [first, second] = res.body.data.options;
    const bus = [first, second].find((option) => option.legs[0].mode === 'AIRPORT_EXPRESS');
    const taxi = [first, second].find((option) => option.legs[0].mode === 'TAXI');

    expect(bus).toMatchObject({ priceMin: 6, isCheapest: true }); // 2 AZN x 3
    expect(taxi).toMatchObject({ priceMin: 25, priceMax: 35, isFastest: true });
    expect(taxi.legs[0].groupPriceMin).toBe(25);
  });

  it('builds a route with one change when there is no direct one', async () => {
    const res = await request(app).get('/api/routes/plan?from=airport&to=bus-station&sort=fastest');

    expect(res.body.data.options).toHaveLength(2);
    expect(res.body.data.options[0].legs.map((leg: { slug: string }) => leg.slug)).toEqual([
      'airport-center-taxi',
      'center-bus-station-metro',
    ]);
  });

  it('returns no options when nothing connects the places', async () => {
    const res = await request(app).get('/api/routes/plan?from=airport&to=mars');
    expect(res.status).toBe(200);
    expect(res.body.data.options).toEqual([]);
  });

  it('validates the query', async () => {
    expect((await request(app).get('/api/routes/plan?from=airport&to=airport')).status).toBe(400);
    expect((await request(app).get('/api/routes/plan?from=airport')).status).toBe(400);
  });
});

describe('itineraries', () => {
  it('lists only published itineraries', async () => {
    const res = await request(app).get('/api/itineraries');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      expect.objectContaining({ slug: 'test-day', days: 2, stopCount: 3 }),
    ]);
  });

  it('groups stops by day and measures the distance between them', async () => {
    const res = await request(app).get('/api/itineraries/test-day');
    const [day1, day2] = res.body.data.itinerary;

    expect(day1.stops.map((stop: { place: { slug: string } }) => stop.place.slug)).toEqual([
      'test-museum',
      'test-restaurant',
    ]);
    expect(day1.stops[0].distanceFromPreviousKm).toBeNull();
    expect(day1.stops[1].distanceFromPreviousKm).toBeGreaterThan(0);
    expect(day2.stops).toHaveLength(1);
    expect(res.body.data.mapPoints).toHaveLength(3);
  });

  it('hides unpublished itineraries', async () => {
    expect((await request(app).get('/api/itineraries/hidden-day')).status).toBe(404);
  });
});
