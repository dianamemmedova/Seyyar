import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { cleanupTokens, expireStaleRequests } from '../../src/lib/jobs';
import { parseDateOnly } from '../../src/lib/dates';
import { resetDatabase } from '../helpers/db';
import { createFixtures, type Fixtures } from '../helpers/fixtures';
import { createUser } from '../helpers/users';

// A fixed "now": 15 June 2026, 14:00 in Baku (10:00 UTC)
const NOW = new Date('2026-06-15T10:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

let fx: Fixtures;
let userId: number;
let counter = 0;

async function addRequest(data: {
  type: 'HOTEL' | 'TABLE';
  date: string;
  time?: string;
  status?: 'NEW' | 'CONFIRMED';
}) {
  counter += 1;
  return prisma.bookingRequest.create({
    data: {
      code: `TRZ-${String(100000 + counter)}`,
      type: data.type,
      status: data.status ?? 'NEW',
      userId,
      placeId: data.type === 'HOTEL' ? fx.hotel.id : fx.restaurant.id,
      dateFrom: parseDateOnly(data.date),
      time: data.time,
      guests: 2,
      contactName: 'Guest',
      contactEmail: 'guest@seyyar.test',
      contactPhone: '+994501234567',
    },
  });
}

const statusOf = async (id: number) =>
  (await prisma.bookingRequest.findUniqueOrThrow({ where: { id } })).status;

beforeAll(async () => {
  await resetDatabase();
  fx = await createFixtures();
  userId = (await createUser()).user.id;
});

describe('expireStaleRequests', () => {
  beforeEach(async () => {
    await prisma.bookingRequest.deleteMany();
  });

  it('expires unanswered requests whose time has passed', async () => {
    const hotelYesterday = await addRequest({ type: 'HOTEL', date: '2026-06-14' });
    const hotelToday = await addRequest({ type: 'HOTEL', date: '2026-06-15' });
    const tableEarlier = await addRequest({ type: 'TABLE', date: '2026-06-15', time: '13:00' });
    const tableLater = await addRequest({ type: 'TABLE', date: '2026-06-15', time: '19:00' });
    const tableTomorrow = await addRequest({ type: 'TABLE', date: '2026-06-16', time: '09:00' });

    const expired = await expireStaleRequests(NOW);

    expect(expired).toBe(2);
    expect(await statusOf(hotelYesterday.id)).toBe('EXPIRED');
    expect(await statusOf(tableEarlier.id)).toBe('EXPIRED');
    // Check-in is today: the hotel can still answer
    expect(await statusOf(hotelToday.id)).toBe('NEW');
    expect(await statusOf(tableLater.id)).toBe('NEW');
    expect(await statusOf(tableTomorrow.id)).toBe('NEW');
  });

  it('never touches confirmed requests', async () => {
    const confirmed = await addRequest({ type: 'HOTEL', date: '2026-06-01', status: 'CONFIRMED' });

    await expireStaleRequests(NOW);
    expect(await statusOf(confirmed.id)).toBe('CONFIRMED');
  });
});

describe('cleanupTokens', () => {
  it('deletes expired and old tokens but keeps the useful ones', async () => {
    const token = (hash: string, expiresAt: Date, revokedAt?: Date) =>
      prisma.refreshToken.create({ data: { userId, tokenHash: hash, expiresAt, revokedAt } });

    await token('expired', new Date(NOW.getTime() - DAY));
    await token(
      'revoked-long-ago',
      new Date(NOW.getTime() + DAY),
      new Date(NOW.getTime() - 8 * DAY),
    );
    await token('revoked-recently', new Date(NOW.getTime() + DAY), new Date(NOW.getTime() - DAY));
    await token('active', new Date(NOW.getTime() + DAY));

    await prisma.passwordResetToken.createMany({
      data: [
        { userId, tokenHash: 'reset-used', expiresAt: new Date(NOW.getTime() + DAY), usedAt: NOW },
        { userId, tokenHash: 'reset-expired', expiresAt: new Date(NOW.getTime() - 1000) },
        { userId, tokenHash: 'reset-active', expiresAt: new Date(NOW.getTime() + 1000) },
      ],
    });

    const removed = await cleanupTokens(NOW);

    expect(removed).toBe(4);
    const refresh = await prisma.refreshToken.findMany({ orderBy: { tokenHash: 'asc' } });
    // The recently revoked one stays, so reuse of a stolen token is still detected
    expect(refresh.map((row) => row.tokenHash)).toEqual(['active', 'revoked-recently']);
    const reset = await prisma.passwordResetToken.findMany();
    expect(reset.map((row) => row.tokenHash)).toEqual(['reset-active']);
  });
});
