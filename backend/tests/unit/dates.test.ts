import { describe, expect, it } from 'vitest';
import {
  addDays,
  bakuToday,
  formatDateOnly,
  nightsBetween,
  parseDateOnly,
  weekdayOf,
} from '../../src/lib/dates';

describe('bakuToday', () => {
  it('uses Baku time, not UTC', () => {
    // 21:30 UTC is already 01:30 the next day in Baku (UTC+4)
    expect(bakuToday(new Date('2026-03-10T21:30:00Z'))).toBe('2026-03-11');
    expect(bakuToday(new Date('2026-03-10T10:00:00Z'))).toBe('2026-03-10');
  });
});

describe('parseDateOnly / formatDateOnly', () => {
  it('turns a date string into midnight UTC and back', () => {
    const date = parseDateOnly('2026-12-20');
    expect(date.toISOString()).toBe('2026-12-20T00:00:00.000Z');
    expect(formatDateOnly(date)).toBe('2026-12-20');
  });
});

describe('addDays', () => {
  it('moves across months and years', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('nightsBetween', () => {
  it('counts nights between check-in and check-out', () => {
    expect(nightsBetween('2026-12-20', '2026-12-23')).toBe(3);
    expect(nightsBetween('2026-12-31', '2027-01-02')).toBe(2);
  });
});

describe('weekdayOf', () => {
  it('returns 0 for Monday and 6 for Sunday', () => {
    expect(weekdayOf('2026-11-30')).toBe(0); // Monday
    expect(weekdayOf('2026-11-29')).toBe(6); // Sunday
  });
});
