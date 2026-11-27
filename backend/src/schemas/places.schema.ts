import * as z from 'zod';
import { LANGS } from '../lib/i18n';

const lang = z.enum(LANGS).default('en');

// "a,b,c" -> ["a", "b", "c"]
const csv = z
  .string()
  .trim()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

// "4,5" -> [4, 5]
const csvNumbers = csv.transform((values) => values.map(Number));

// Query strings are text: "true" / "false"
const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true');

// Accepts "hotel" or "HOTEL"
export const placeTypeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(['HOTEL', 'RESTAURANT', 'ATTRACTION']));

const page = z.coerce.number().int().min(1).default(1);

export const listPlacesQuerySchema = z
  .object({
    lang,
    type: placeTypeSchema.optional(),
    q: z.string().trim().min(2).max(100).optional(),
    area: csv.optional(),
    categories: csv.optional(),
    amenities: csv.optional(),
    stars: csvNumbers.pipe(z.array(z.number().int().min(1).max(5))).optional(),
    priceLevel: csvNumbers.pipe(z.array(z.number().int().min(1).max(3))).optional(),
    priceMin: z.coerce.number().min(0).optional(),
    priceMax: z.coerce.number().min(0).optional(),
    hasDiscount: booleanFlag.optional(),
    verifiedOnly: booleanFlag.optional(),
    openNow: booleanFlag.optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating', 'nearest']).default('recommended'),
    page,
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .refine((query) => query.sort !== 'nearest' || (query.lat !== undefined && query.lng !== undefined), {
    error: 'lat and lng are required when sort=nearest',
    path: ['sort'],
  });

export const mapQuerySchema = z.object({
  lang,
  type: placeTypeSchema.optional(),
  // minLng,minLat,maxLng,maxLat — the visible part of the map
  bbox: z
    .string()
    .transform((value) => value.split(',').map(Number))
    .pipe(z.tuple([z.number(), z.number(), z.number(), z.number()]))
    .optional(),
});

export const slugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(200),
});

export const langQuerySchema = z.object({ lang });

export const reviewsQuerySchema = z.object({
  lang,
  travelType: z.enum(['family', 'couple', 'solo', 'friends']).optional(),
  page,
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const nearbyQuerySchema = z.object({
  lang,
  type: placeTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export const filtersQuerySchema = z.object({
  lang,
  type: placeTypeSchema,
});

export type ListPlacesQuery = z.infer<typeof listPlacesQuerySchema>;
export type MapQuery = z.infer<typeof mapQuerySchema>;
export type ReviewsQuery = z.infer<typeof reviewsQuerySchema>;
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
export type FiltersQuery = z.infer<typeof filtersQuerySchema>;
