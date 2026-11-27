import { describe, expect, it } from 'vitest';
import { registerSchema } from '../../src/schemas/auth.schema';
import { createRequestSchema, requestCodeParamsSchema } from '../../src/schemas/requests.schema';
import { createReviewSchema } from '../../src/schemas/reviews.schema';
import { partnerApplicationSchema } from '../../src/schemas/forms.schema';
import { planQuerySchema } from '../../src/schemas/transport.schema';
import { listPlacesQuerySchema } from '../../src/schemas/places.schema';

// The first error message of a failed parse
const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('registerSchema', () => {
  const valid = { fullName: 'Diana', email: '  Diana@Example.COM ', password: 'Password123' };

  it('trims and lower-cases the email', () => {
    expect(registerSchema.parse(valid).email).toBe('diana@example.com');
  });

  it.each([
    ['short', 'Password must be at least 8 characters'],
    ['12345678', 'Password must contain at least one letter'],
    ['password', 'Password must contain at least one digit'],
  ])('rejects the password "%s"', (password, message) => {
    expect(firstError(registerSchema.safeParse({ ...valid, password }))).toBe(message);
  });

  it('rejects passwords longer than 72 bytes (bcrypt limit)', () => {
    const result = registerSchema.safeParse({ ...valid, password: `a1${'ə'.repeat(40)}` });
    expect(firstError(result)).toBe('Password is too long');
  });
});

describe('createRequestSchema', () => {
  const contact = { contactName: 'Diana', contactEmail: 'd@x.az', contactPhone: '+994501234567' };

  it('picks the hotel shape by "type"', () => {
    const result = createRequestSchema.parse({
      type: 'HOTEL',
      placeSlug: 'x',
      dateFrom: '2026-12-20',
      dateTo: '2026-12-22',
      guests: 2,
      rooms: [{ roomId: 1, quantity: 1 }],
      ...contact,
    });
    expect(result).toMatchObject({
      type: 'HOTEL',
      children: 0,
      contactWhatsapp: false,
      specialRequests: [],
    });
  });

  it('rejects the same room listed twice', () => {
    const result = createRequestSchema.safeParse({
      type: 'HOTEL',
      placeSlug: 'x',
      dateFrom: '2026-12-20',
      dateTo: '2026-12-22',
      guests: 2,
      rooms: [
        { roomId: 1, quantity: 1 },
        { roomId: 1, quantity: 2 },
      ],
      ...contact,
    });
    expect(firstError(result)).toBe('Each room can be listed only once');
  });

  it('checks the table time format', () => {
    const result = createRequestSchema.safeParse({
      type: 'TABLE',
      placeSlug: 'x',
      date: '2026-12-20',
      time: '25:00',
      guests: 2,
      ...contact,
    });
    expect(firstError(result)).toBe('Time must be in HH:MM format');
  });

  it('rejects an unknown type', () => {
    expect(createRequestSchema.safeParse({ type: 'TAXI', ...contact }).success).toBe(false);
  });
});

describe('requestCodeParamsSchema', () => {
  it('accepts lower case and returns upper case', () => {
    expect(requestCodeParamsSchema.parse({ code: 'trz-123456' }).code).toBe('TRZ-123456');
  });

  it('rejects other formats', () => {
    expect(requestCodeParamsSchema.safeParse({ code: 'TRZ-12' }).success).toBe(false);
  });
});

describe('createReviewSchema', () => {
  it('accepts only photos uploaded to our server', () => {
    const own = 'http://localhost:5050/uploads/reviews/123e4567-e89b-12d3-a456-426614174000.webp';
    const base = { requestCode: 'TRZ-123456', rating: 5 };

    expect(createReviewSchema.safeParse({ ...base, photos: [own] }).success).toBe(true);
    expect(
      firstError(createReviewSchema.safeParse({ ...base, photos: ['https://evil.com/a.webp'] })),
    ).toBe('Photos must be uploaded with /api/uploads/reviews first');
  });

  it('keeps the rating between 1 and 5', () => {
    expect(createReviewSchema.safeParse({ requestCode: 'TRZ-123456', rating: 0 }).success).toBe(
      false,
    );
    expect(createReviewSchema.safeParse({ requestCode: 'TRZ-123456', rating: 6 }).success).toBe(
      false,
    );
  });
});

describe('partnerApplicationSchema', () => {
  it('requires a 10-digit VOEN', () => {
    const result = partnerApplicationSchema.safeParse({
      businessType: 'HOTEL',
      businessName: 'Test',
      voen: '12345',
      address: 'Baku, Nizami 1',
      contactName: 'Ali',
      phone: '+994501234567',
      email: 'ali@x.az',
    });
    expect(firstError(result)).toBe('VOEN must be 10 digits');
  });
});

describe('planQuerySchema', () => {
  it('rejects the same start and destination', () => {
    const result = planQuerySchema.safeParse({ from: 'Airport', to: 'airport' });
    expect(firstError(result)).toBe('Start and destination must be different');
  });
});

describe('listPlacesQuerySchema', () => {
  it('turns query strings into typed values', () => {
    const query = listPlacesQuerySchema.parse({
      type: 'hotel',
      stars: '4,5',
      hasDiscount: 'true',
      page: '2',
    });
    expect(query).toMatchObject({
      type: 'HOTEL',
      stars: [4, 5],
      hasDiscount: true,
      page: 2,
      limit: 12,
    });
  });

  it('needs coordinates for sort=nearest', () => {
    expect(listPlacesQuerySchema.safeParse({ sort: 'nearest' }).success).toBe(false);
    expect(
      listPlacesQuerySchema.safeParse({ sort: 'nearest', lat: '40.4', lng: '49.8' }).success,
    ).toBe(true);
  });
});
