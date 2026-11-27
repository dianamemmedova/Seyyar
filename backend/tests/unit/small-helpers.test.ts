import { describe, expect, it } from 'vitest';
import { distanceKm } from '../../src/lib/geo';
import { localize, localizeOptional } from '../../src/lib/i18n';
import { generateSecureToken, hashToken } from '../../src/lib/tokens';
import { signAccessToken, TokenExpiredError, verifyAccessToken } from '../../src/lib/jwt';
import jwt from 'jsonwebtoken';

describe('distanceKm', () => {
  it('is 0 for the same point', () => {
    expect(distanceKm({ lat: 40.4, lng: 49.8 }, { lat: 40.4, lng: 49.8 })).toBe(0);
  });

  it('measures Baku - Ganja (about 300 km in a straight line)', () => {
    const km = distanceKm({ lat: 40.4093, lng: 49.8671 }, { lat: 40.6828, lng: 46.3606 });
    expect(km).toBeGreaterThan(290);
    expect(km).toBeLessThan(305);
  });
});

describe('localize', () => {
  const name = { en: 'Maiden Tower', ru: 'Девичья башня', az: 'Qız qalası' };

  it('returns the requested language', () => {
    expect(localize(name, 'az')).toBe('Qız qalası');
  });

  it('falls back to English', () => {
    expect(localize({ en: 'Only English' }, 'ru')).toBe('Only English');
  });

  it('returns an empty string for missing values', () => {
    expect(localize(null, 'en')).toBe('');
    expect(localize('plain text', 'en')).toBe('');
    expect(localizeOptional({}, 'en')).toBeNull();
  });
});

describe('tokens', () => {
  it('generates long, URL-safe, unique tokens', () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).toHaveLength(64);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a).not.toBe(b);
  });

  it('hashes the same token to the same SHA-256 value', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });
});

describe('jwt', () => {
  it('signs and verifies an access token', () => {
    const token = signAccessToken({ userId: 7, role: 'ADMIN' });
    expect(verifyAccessToken(token)).toEqual({ userId: 7, role: 'ADMIN' });
  });

  it('rejects a token signed with another secret', () => {
    const fake = jwt.sign({ role: 'ADMIN' }, 'another-secret-another-secret-123', { subject: '1' });
    expect(() => verifyAccessToken(fake)).toThrow();
  });

  it('reports expired tokens with TokenExpiredError', () => {
    const expired = jwt.sign({ role: 'TOURIST' }, process.env.JWT_SECRET!, {
      subject: '1',
      expiresIn: -10,
    });
    expect(() => verifyAccessToken(expired)).toThrow(TokenExpiredError);
  });
});
