import { describe, expect, it } from 'vitest';
import { assertTransition, canTransition, STATUS_GROUPS } from '../../src/lib/request-status';
import { ConflictError } from '../../src/lib/errors';

describe('canTransition', () => {
  it('allows the normal flow', () => {
    expect(canTransition('NEW', 'CONFIRMED')).toBe(true);
    expect(canTransition('NEW', 'CANCELLED')).toBe(true);
    expect(canTransition('CONFIRMED', 'ARRIVED')).toBe(true);
    expect(canTransition('CONFIRMED', 'NO_SHOW')).toBe(true);
  });

  it('blocks going back or leaving a final status', () => {
    expect(canTransition('CONFIRMED', 'NEW')).toBe(false);
    expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
    expect(canTransition('ARRIVED', 'CANCELLED')).toBe(false);
    expect(canTransition('NEW', 'ARRIVED')).toBe(false);
  });
});

describe('assertTransition', () => {
  it('throws 409 INVALID_STATUS_TRANSITION for a forbidden change', () => {
    expect(() => assertTransition('CANCELLED', 'CANCELLED')).toThrow(ConflictError);

    try {
      assertTransition('DECLINED', 'CONFIRMED');
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 409, code: 'INVALID_STATUS_TRANSITION' });
    }
  });

  it('does nothing for an allowed change', () => {
    expect(() => assertTransition('NEW', 'CONFIRMED')).not.toThrow();
  });
});

describe('STATUS_GROUPS', () => {
  it('puts every status in exactly one tab', () => {
    const all = Object.values(STATUS_GROUPS).flat();
    expect(all).toHaveLength(7);
    expect(new Set(all).size).toBe(7);
  });
});
