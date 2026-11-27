import { describe, expect, it } from 'vitest';
import { bakuClock, isOpenAt, todayHours, type HoursRow } from '../../src/lib/opening-hours';

// 2026-11-30 is a Monday. Baku = UTC+4, so 06:00Z = 10:00 in Baku.
const at = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours - 4, minutes));
};

const every = (opensAt: string, closesAt: string): HoursRow[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt, closesAt, isClosed: false }));

describe('bakuClock', () => {
  it('returns the Baku weekday and time', () => {
    expect(bakuClock(at('2026-11-30', '10:05'))).toEqual({ dayOfWeek: 0, time: '10:05' });
    // 22:00 UTC on Sunday is already Monday 02:00 in Baku
    expect(bakuClock(new Date('2026-11-29T22:00:00Z'))).toEqual({ dayOfWeek: 0, time: '02:00' });
  });
});

describe('isOpenAt', () => {
  it('returns null when there are no opening hours', () => {
    expect(isOpenAt([], at('2026-11-30', '12:00'))).toBeNull();
  });

  it('handles a normal day', () => {
    const hours = every('10:00', '18:00');
    expect(isOpenAt(hours, at('2026-11-30', '09:59'))).toBe(false);
    expect(isOpenAt(hours, at('2026-11-30', '10:00'))).toBe(true);
    expect(isOpenAt(hours, at('2026-11-30', '17:59'))).toBe(true);
    expect(isOpenAt(hours, at('2026-11-30', '18:00'))).toBe(false);
  });

  it('handles places open after midnight (18:00 - 02:00)', () => {
    const hours = every('18:00', '02:00');
    expect(isOpenAt(hours, at('2026-11-30', '17:00'))).toBe(false);
    expect(isOpenAt(hours, at('2026-11-30', '23:30'))).toBe(true);
    // 01:00 on Tuesday is still Monday's evening
    expect(isOpenAt(hours, at('2026-12-01', '01:00'))).toBe(true);
    expect(isOpenAt(hours, at('2026-12-01', '03:00'))).toBe(false);
  });

  it('respects closed days', () => {
    const hours = every('10:00', '18:00').map((row) =>
      row.dayOfWeek === 0 ? { ...row, isClosed: true } : row,
    );
    expect(isOpenAt(hours, at('2026-11-30', '12:00'))).toBe(false); // Monday
    expect(isOpenAt(hours, at('2026-12-01', '12:00'))).toBe(true); // Tuesday
  });
});

describe('todayHours', () => {
  it('returns the row of the current Baku weekday', () => {
    const hours = every('10:00', '18:00');
    expect(todayHours(hours, at('2026-12-02', '12:00'))?.dayOfWeek).toBe(2); // Wednesday
  });
});
