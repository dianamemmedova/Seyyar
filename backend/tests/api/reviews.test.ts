import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { recalculatePlaceRating } from '../../src/services/reviews.service';
import { resetDatabase } from '../helpers/db';
import { createFixtures, daysFromToday, type Fixtures } from '../helpers/fixtures';
import { createUser } from '../helpers/users';

let fx: Fixtures;

beforeAll(async () => {
  await resetDatabase();
  fx = await createFixtures();
});

beforeEach(async () => {
  await prisma.review.deleteMany();
  await prisma.bookingRequest.deleteMany();
  await prisma.place.update({ where: { id: fx.hotel.id }, data: { ratingAvg: 0, ratingCount: 0 } });
});

// Creates a hotel request for the user through the API and puts it in the given status
async function visit(
  user: Awaited<ReturnType<typeof createUser>>,
  status: 'ARRIVED' | 'CONFIRMED' = 'ARRIVED',
) {
  const res = await request(app)
    .post('/api/requests')
    .set(user.auth)
    .send({
      type: 'HOTEL',
      placeSlug: 'test-hotel',
      dateFrom: daysFromToday(5),
      dateTo: daysFromToday(6),
      guests: 1,
      rooms: [{ roomId: fx.rooms.standard.id, quantity: 1 }],
      contactName: 'Guest',
      contactEmail: 'guest@seyyar.test',
      contactPhone: '+994501234567',
    });

  await prisma.bookingRequest.update({ where: { code: res.body.data.code }, data: { status } });
  return res.body.data.code as string;
}

const review = (user: Awaited<ReturnType<typeof createUser>>, body: Record<string, unknown>) =>
  request(app).post('/api/reviews').set(user.auth).send(body);

describe('POST /api/reviews', () => {
  it('saves the review and updates the place rating', async () => {
    const tourist = await createUser({ fullName: 'Diana Mammadova' });
    const code = await visit(tourist);

    const res = await review(tourist, {
      requestCode: code,
      rating: 4,
      categoryRatings: { cleanliness: 5, staff: 4 },
      text: 'Lovely place, friendly staff.',
      travelType: 'couple',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ requestCode: code, rating: 4, status: 'PUBLISHED' });

    const place = await prisma.place.findUniqueOrThrow({ where: { id: fx.hotel.id } });
    expect(place).toMatchObject({ ratingAvg: 4, ratingCount: 1 });
  });

  it('calculates the average of all reviews', async () => {
    for (const rating of [5, 4, 2]) {
      const user = await createUser();
      await review(user, { requestCode: await visit(user), rating });
    }

    const place = await prisma.place.findUniqueOrThrow({ where: { id: fx.hotel.id } });
    expect(place.ratingCount).toBe(3);
    expect(place.ratingAvg).toBeCloseTo(11 / 3);
  });

  it('shows the review on the place page with a short author name', async () => {
    const tourist = await createUser({ fullName: 'Diana Mammadova' });
    await review(tourist, {
      requestCode: await visit(tourist),
      rating: 5,
      text: 'Wonderful stay!!',
    });

    const res = await request(app).get('/api/places/test-hotel/reviews');
    expect(res.body.data[0]).toMatchObject({ author: 'Diana M.', rating: 5 });
    expect(res.body.meta).toMatchObject({ ratingAvg: 5, ratingCount: 1 });
  });

  it('allows a review only after the visit', async () => {
    const tourist = await createUser();
    const code = await visit(tourist, 'CONFIRMED');

    const res = await review(tourist, { requestCode: code, rating: 5 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('REVIEW_NOT_ALLOWED');
  });

  it('allows one review per visit', async () => {
    const tourist = await createUser();
    const code = await visit(tourist);

    await review(tourist, { requestCode: code, rating: 5 });
    const second = await review(tourist, { requestCode: code, rating: 1 });

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('REVIEW_EXISTS');
  });

  it("does not allow reviewing someone else's visit", async () => {
    const owner = await createUser();
    const code = await visit(owner);
    const stranger = await createUser();

    const res = await review(stranger, { requestCode: code, rating: 1 });
    expect(res.status).toBe(404);
  });

  it('rejects rating categories of another place type', async () => {
    const tourist = await createUser();
    const res = await review(tourist, {
      requestCode: await visit(tourist),
      rating: 5,
      categoryRatings: { food: 5 }, // restaurant category on a hotel
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CATEGORY_RATINGS');
  });

  it('marks the request as reviewed', async () => {
    const tourist = await createUser();
    const code = await visit(tourist);

    const before = await request(app).get(`/api/requests/${code}`).set(tourist.auth);
    await review(tourist, { requestCode: code, rating: 5 });
    const after = await request(app).get(`/api/requests/${code}`).set(tourist.auth);

    expect(before.body.data.canReview).toBe(true);
    expect(after.body.data.canReview).toBe(false);
  });
});

describe('GET /api/reviews/my', () => {
  it('lists only my reviews', async () => {
    const tourist = await createUser();
    const stranger = await createUser();
    await review(tourist, { requestCode: await visit(tourist), rating: 5 });
    await review(stranger, { requestCode: await visit(stranger), rating: 3 });

    const res = await request(app).get('/api/reviews/my').set(tourist.auth);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ rating: 5, place: { slug: 'test-hotel' } });
  });
});

describe('recalculatePlaceRating', () => {
  it('ignores hidden reviews', async () => {
    const a = await createUser();
    const b = await createUser();
    await review(a, { requestCode: await visit(a), rating: 5 });
    await review(b, { requestCode: await visit(b), rating: 1 });

    // The admin hides the 1-star review
    await prisma.review.updateMany({ where: { rating: 1 }, data: { status: 'HIDDEN' } });
    await recalculatePlaceRating(fx.hotel.id);

    const place = await prisma.place.findUniqueOrThrow({ where: { id: fx.hotel.id } });
    expect(place).toMatchObject({ ratingAvg: 5, ratingCount: 1 });
  });
});
