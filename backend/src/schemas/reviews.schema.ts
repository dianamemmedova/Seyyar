import * as z from 'zod';
import { LANGS } from '../lib/i18n';

// Which category scores each place type can have
export const CATEGORY_KEYS = {
  HOTEL: ['cleanliness', 'location', 'staff', 'comfort', 'value'],
  RESTAURANT: ['food', 'service', 'atmosphere', 'value'],
} as const;

const score = z.number().int().min(1, { error: 'Rating must be 1-5' }).max(5, { error: 'Rating must be 1-5' });

export const createReviewSchema = z.object({
  requestCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^TRZ-\d{6}$/, { error: 'Invalid request code' }),
  rating: score,
  // { "cleanliness": 5, "staff": 4 } - keys are checked in the service by place type
  categoryRatings: z.record(z.string(), score).optional(),
  text: z.string().trim().min(10, { error: 'Review must be at least 10 characters' }).max(2000).optional(),
  travelType: z.enum(['family', 'couple', 'solo', 'friends']).optional(),
});

export const myReviewsQuerySchema = z.object({
  lang: z.enum(LANGS).default('en'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type MyReviewsQuery = z.infer<typeof myReviewsQuerySchema>;
