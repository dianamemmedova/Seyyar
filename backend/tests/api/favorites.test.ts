import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { resetDatabase } from '../helpers/db';
import { createFixtures } from '../helpers/fixtures';
import { createUser } from '../helpers/users';

let tourist: Awaited<ReturnType<typeof createUser>>;

beforeAll(async () => {
  await resetDatabase();
  await createFixtures();
});

beforeEach(async () => {
  await prisma.favorite.deleteMany();
  tourist = await createUser();
});

const add = (slug: string, auth = tourist.auth) =>
  request(app).put(`/api/favorites/${slug}`).set(auth);

describe('PUT /api/favorites/:slug', () => {
  it('adds a place, and adding it again is not an error', async () => {
    const first = await add('test-hotel');
    const second = await add('test-hotel');

    expect(first.status).toBe(200);
    expect(first.body.data).toEqual({ slug: 'test-hotel', isFavorite: true });
    expect(second.status).toBe(200);
    expect(await prisma.favorite.count()).toBe(1);
  });

  it('returns 404 for unknown and unpublished places', async () => {
    expect((await add('nope')).status).toBe(404);
    expect((await add('draft-hotel')).status).toBe(404);
  });

  it('needs a logged-in user', async () => {
    const res = await request(app).put('/api/favorites/test-hotel');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/favorites', () => {
  it('lists my favorites as place cards, newest first', async () => {
    await add('test-hotel');
    await add('test-museum');
    // Another user's favorite must not appear
    const stranger = await createUser();
    await add('late-bar', stranger.auth);

    const res = await request(app).get('/api/favorites').set(tourist.auth);

    expect(res.status).toBe(200);
    expect(res.body.data.map((p: { slug: string }) => p.slug)).toEqual([
      'test-museum',
      'test-hotel',
    ]);
    expect(res.body.data[0]).toMatchObject({ type: 'ATTRACTION', favoritedAt: expect.any(String) });
    expect(res.body.meta.total).toBe(2);
  });

  it('filters by type', async () => {
    await add('test-hotel');
    await add('test-museum');

    const res = await request(app).get('/api/favorites?type=hotel').set(tourist.auth);
    expect(res.body.data.map((p: { slug: string }) => p.slug)).toEqual(['test-hotel']);
  });
});

describe('GET /api/favorites/slugs', () => {
  it('returns only the slugs (for the heart icons)', async () => {
    await add('test-hotel');
    await add('late-bar');

    const res = await request(app).get('/api/favorites/slugs').set(tourist.auth);
    expect(res.body.data.sort()).toEqual(['late-bar', 'test-hotel']);
  });
});

describe('DELETE /api/favorites/:slug', () => {
  it('removes a place, and removing it again is not an error', async () => {
    await add('test-hotel');

    const first = await request(app).delete('/api/favorites/test-hotel').set(tourist.auth);
    const second = await request(app).delete('/api/favorites/test-hotel').set(tourist.auth);

    expect(first.status).toBe(204);
    expect(second.status).toBe(204);
    expect(await prisma.favorite.count()).toBe(0);
  });

  it("does not touch other users' favorites", async () => {
    const stranger = await createUser();
    await add('test-hotel', stranger.auth);

    await request(app).delete('/api/favorites/test-hotel').set(tourist.auth);
    expect(await prisma.favorite.count()).toBe(1);
  });
});
