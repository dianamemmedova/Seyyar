import { prisma } from './prisma';
import { bakuToday, parseDateOnly } from './dates';
import { bakuClock } from './opening-hours';

const DAY_MS = 24 * 60 * 60 * 1000;
const EVERY_15_MINUTES = 15 * 60 * 1000;

// A request nobody answered before the visit time can no longer be confirmed
export async function expireStaleRequests(now = new Date()): Promise<number> {
  const today = parseDateOnly(bakuToday(now));
  const time = bakuClock(now).time;

  const result = await prisma.bookingRequest.updateMany({
    where: {
      status: 'NEW',
      OR: [
        // Hotel check-in day or table day has passed
        { dateFrom: { lt: today } },
        // Table for today, and the time has passed
        { type: 'TABLE', dateFrom: today, time: { lt: time } },
      ],
    },
    data: { status: 'EXPIRED' },
  });

  return result.count;
}

// Old tokens are useless; removing them keeps the tables small
export async function cleanupTokens(now = new Date()): Promise<number> {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [refresh, reset] = await prisma.$transaction([
    prisma.refreshToken.deleteMany({
      // Revoked tokens are kept for a week, so reuse of a stolen token is still detected
      where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: weekAgo } }] },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
    }),
  ]);

  return refresh.count + reset.count;
}

let running = false;

async function runJobs(): Promise<void> {
  // If the previous run is still busy, skip this one
  if (running) return;
  running = true;

  try {
    const expired = await expireStaleRequests();
    const removed = await cleanupTokens();

    if (expired > 0 || removed > 0) {
      console.log(`[jobs] ${expired} sorğu EXPIRED oldu, ${removed} köhnə token silindi`);
    }
  } catch (error) {
    // A failed run is logged; the next run tries again
    console.error('[jobs] Xəta:', error);
  } finally {
    running = false;
  }
}

// Runs once at start and then every 15 minutes. Returns a function that stops it.
export function startJobs(): () => void {
  void runJobs();

  const timer = setInterval(() => void runJobs(), EVERY_15_MINUTES);
  // Do not keep the process alive only because of this timer
  timer.unref();

  return () => clearInterval(timer);
}
