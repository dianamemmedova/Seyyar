import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { testOutbox } from '../../src/lib/mailer';
import { resetDatabase } from '../helpers/db';
import { createFixtures, daysFromToday, nextWeekday, type Fixtures } from '../helpers/fixtures';
import { createUser } from '../helpers/users';

let fx: Fixtures;
let tourist: Awaited<ReturnType<typeof createUser>>;

const CONTACT = {
  contactName: 'Diana',
  contactEmail: 'diana@seyyar.test',
  contactPhone: '+994501234567',
  contactWhatsapp: true,
};

const hotelBody = (overrides: Record<string, unknown> = {}) => ({
  type: 'HOTEL',
  placeSlug: 'test-hotel',
  dateFrom: daysFromToday(10),
  dateTo: daysFromToday(13),
  guests: 2,
  rooms: [{ roomId: fx.rooms.standard.id, quantity: 1 }],
  ...CONTACT,
  ...overrides,
});

// A Tuesday: the test restaurant is closed only on Mondays
const tableBody = (overrides: Record<string, unknown> = {}) => ({
  type: 'TABLE',
  placeSlug: 'test-restaurant',
  date: nextWeekday(1),
  time: '19:30',
  guests: 4,
  items: [],
  ...CONTACT,
  ...overrides,
});

const send = (body: object, auth = tourist.auth) =>
  request(app).post('/api/requests').set(auth).send(body);

beforeAll(async () => {
  await resetDatabase();
  fx = await createFixtures();
});

beforeEach(async () => {
  await prisma.bookingRequest.deleteMany();
  tourist = await createUser();
});

describe('POST /api/requests (hotel)', () => {
  it('creates a request with a TRZ code and the total price', async () => {
    const res = await send(
      hotelBody({ rooms: [{ roomId: fx.rooms.family.id, quantity: 2 }], guests: 6 }),
    );

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      type: 'HOTEL',
      status: 'NEW',
      nights: 3,
      totalEstimate: 1080, // 180 AZN x 2 rooms x 3 nights
      canCancel: true,
      canReview: false,
    });
    expect(res.body.data.code).toMatch(/^TRZ-\d{6}$/);
    expect(res.body.data.items).toEqual([
      expect.objectContaining({
        kind: 'ROOM',
        name: 'Family',
        quantity: 2,
        unitPrice: 180,
        lineTotal: 360,
      }),
    ]);
  });

  it('emails the hotel (in Azerbaijani) and the tourist (in English)', async () => {
    const res = await send(hotelBody());
    const code = res.body.data.code;

    expect(testOutbox.map((mail) => mail.to).sort()).toEqual([
      'diana@seyyar.test',
      'hotel@seyyar.test',
    ]);
    expect(testOutbox.find((mail) => mail.to === 'hotel@seyyar.test')!.subject).toContain(
      `Yeni rezerv sorğusu ${code}`,
    );
    expect(testOutbox.find((mail) => mail.to === 'diana@seyyar.test')!.text).toContain(
      `/account/requests/${code}`,
    );
  });

  it('sends the place email to the admin when the place has no email', async () => {
    await send(
      hotelBody({ placeSlug: 'sea-hotel', rooms: [{ roomId: fx.rooms.sea.id, quantity: 1 }] }),
    );
    expect(testOutbox.map((mail) => mail.to)).toContain('admin@seyyar.test');
  });

  it.each([
    ['DATE_IN_PAST', () => ({ dateFrom: daysFromToday(-1), dateTo: daysFromToday(2) })],
    ['DATE_TOO_FAR', () => ({ dateFrom: daysFromToday(400), dateTo: daysFromToday(402) })],
    ['INVALID_DATES', () => ({ dateFrom: daysFromToday(10), dateTo: daysFromToday(10) })],
    ['STAY_TOO_LONG', () => ({ dateFrom: daysFromToday(10), dateTo: daysFromToday(41) })],
    ['NOT_ENOUGH_CAPACITY', () => ({ guests: 2, children: 1 })],
    ['ROOM_NOT_AVAILABLE', () => ({ rooms: [{ roomId: fx.rooms.closed.id, quantity: 1 }] })],
    ['ROOM_NOT_AVAILABLE', () => ({ rooms: [{ roomId: fx.rooms.sea.id, quantity: 1 }] })], // another hotel's room
    ['WRONG_REQUEST_TYPE', () => ({ placeSlug: 'test-restaurant' })],
  ])('rejects with %s', async (code, overrides) => {
    const res = await send(hotelBody(overrides()));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(code);
    expect(await prisma.bookingRequest.count()).toBe(0);
  });

  it('returns 404 for an unknown or unpublished place', async () => {
    expect((await send(hotelBody({ placeSlug: 'nope' }))).status).toBe(404);
    expect((await send(hotelBody({ placeSlug: 'draft-hotel' }))).status).toBe(404);
  });

  it('needs a logged-in user', async () => {
    const res = await request(app).post('/api/requests').send(hotelBody());
    expect(res.status).toBe(401);
  });
});

describe('POST /api/requests (table)', () => {
  it('creates a table request with a pre-order', async () => {
    const res = await send(
      tableBody({
        items: [
          { menuItemId: fx.menu.plov.id, quantity: 2 },
          { menuItemId: fx.menu.tea.id, quantity: 4, note: 'no sugar' },
        ],
      }),
    );

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      type: 'TABLE',
      time: '19:30',
      totalEstimate: 42,
      nights: null,
    });
    expect(res.body.data.items[1]).toMatchObject({
      kind: 'MENU_ITEM',
      name: 'Tea',
      note: 'no sugar',
    });
  });

  it('has no total without a pre-order', async () => {
    const res = await send(tableBody());
    expect(res.status).toBe(201);
    expect(res.body.data.totalEstimate).toBeNull();
  });

  it('accepts a late time at a place that closes after midnight', async () => {
    const res = await send(tableBody({ placeSlug: 'late-bar', time: '01:00' }));
    expect(res.status).toBe(201);
  });

  it.each([
    ['OUTSIDE_OPENING_HOURS', () => ({ time: '08:00' })],
    ['OUTSIDE_OPENING_HOURS', () => ({ date: nextWeekday(0) })], // Monday: closed
    ['OUTSIDE_OPENING_HOURS', () => ({ placeSlug: 'late-bar', time: '03:00' })],
    ['DATE_IN_PAST', () => ({ date: daysFromToday(-1) })],
    ['DATE_TOO_FAR', () => ({ date: daysFromToday(120) })],
    [
      'MENU_ITEM_NOT_AVAILABLE',
      () => ({ items: [{ menuItemId: fx.menu.soldOut.id, quantity: 1 }] }),
    ],
    // A dish from another restaurant
    [
      'MENU_ITEM_NOT_AVAILABLE',
      () => ({ items: [{ menuItemId: fx.menu.lateBarDrink.id, quantity: 1 }] }),
    ],
    ['WRONG_REQUEST_TYPE', () => ({ placeSlug: 'test-hotel' })],
  ])('rejects with %s', async (code, overrides) => {
    const res = await send(tableBody(overrides()));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(code);
  });
});

describe('GET /api/requests/my', () => {
  it('lists only my requests, newest first, by tab', async () => {
    const first = await send(hotelBody());
    const second = await send(tableBody());
    await prisma.bookingRequest.update({
      where: { code: first.body.data.code },
      data: { status: 'CANCELLED' },
    });

    // Somebody else's request
    const stranger = await createUser();
    await send(tableBody(), stranger.auth);

    const all = await request(app).get('/api/requests/my').set(tourist.auth);
    const active = await request(app).get('/api/requests/my?status=active').set(tourist.auth);
    const cancelled = await request(app).get('/api/requests/my?status=cancelled').set(tourist.auth);

    expect(all.body.data.map((r: { code: string }) => r.code)).toEqual([
      second.body.data.code,
      first.body.data.code,
    ]);
    expect(all.body.meta).toMatchObject({ total: 2 });
    expect(active.body.data).toHaveLength(1);
    expect(cancelled.body.data[0]).toMatchObject({ code: first.body.data.code, canCancel: false });
  });

  it('filters by type and paginates', async () => {
    await send(hotelBody());
    await send(tableBody());
    await send(tableBody({ time: '20:00' }));

    const res = await request(app)
      .get('/api/requests/my?type=TABLE&limit=1&page=2')
      .set(tourist.auth);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
  });
});

describe('GET /api/requests/:code', () => {
  it('shows my request (code in any letter case)', async () => {
    const created = await send(hotelBody());
    const res = await request(app)
      .get(`/api/requests/${created.body.data.code.toLowerCase()}`)
      .set(tourist.auth);

    expect(res.status).toBe(200);
    expect(res.body.data.contact).toMatchObject({ name: 'Diana', whatsapp: true });
  });

  it("hides another user's request behind 404", async () => {
    const created = await send(hotelBody());
    const stranger = await createUser();

    const res = await request(app)
      .get(`/api/requests/${created.body.data.code}`)
      .set(stranger.auth);
    expect(res.status).toBe(404);
  });

  it('rejects a badly formatted code', async () => {
    const res = await request(app).get('/api/requests/ABC-1').set(tourist.auth);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/requests/:code/cancel', () => {
  it('cancels and emails the place', async () => {
    const created = await send(hotelBody());
    testOutbox.length = 0;

    const res = await request(app)
      .patch(`/api/requests/${created.body.data.code}/cancel`)
      .set(tourist.auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'CANCELLED', canCancel: false });
    expect(res.body.data.cancelledAt).toEqual(expect.any(String));
    expect(testOutbox).toEqual([
      expect.objectContaining({
        to: 'hotel@seyyar.test',
        subject: expect.stringContaining('ləğv'),
      }),
    ]);
  });

  it('cannot cancel twice or after the visit', async () => {
    const created = await send(hotelBody());
    const code = created.body.data.code;
    await request(app).patch(`/api/requests/${code}/cancel`).set(tourist.auth);

    const again = await request(app).patch(`/api/requests/${code}/cancel`).set(tourist.auth);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('INVALID_STATUS_TRANSITION');

    const visited = await send(tableBody());
    await prisma.bookingRequest.update({
      where: { code: visited.body.data.code },
      data: { status: 'ARRIVED' },
    });
    const afterVisit = await request(app)
      .patch(`/api/requests/${visited.body.data.code}/cancel`)
      .set(tourist.auth);
    expect(afterVisit.status).toBe(409);
  });
});

describe('POST /api/requests/:code/messages', () => {
  it('adds a message and shows it in the request', async () => {
    const created = await send(hotelBody());
    const code = created.body.data.code;

    const res = await request(app)
      .post(`/api/requests/${code}/messages`)
      .set(tourist.auth)
      .send({ text: '  Can we arrive at 23:00?  ' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ text: 'Can we arrive at 23:00?', fromMe: true });

    const detail = await request(app).get(`/api/requests/${code}`).set(tourist.auth);
    expect(detail.body.data.messages).toHaveLength(1);
  });

  it('refuses messages to a cancelled request', async () => {
    const created = await send(hotelBody());
    const code = created.body.data.code;
    await request(app).patch(`/api/requests/${code}/cancel`).set(tourist.auth);

    const res = await request(app)
      .post(`/api/requests/${code}/messages`)
      .set(tourist.auth)
      .send({ text: 'Hi' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('REQUEST_CLOSED');
  });

  it('rejects an empty message', async () => {
    const created = await send(hotelBody());
    const res = await request(app)
      .post(`/api/requests/${created.body.data.code}/messages`)
      .set(tourist.auth)
      .send({ text: '   ' });
    expect(res.status).toBe(400);
  });
});
