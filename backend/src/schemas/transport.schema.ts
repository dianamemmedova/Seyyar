import * as z from 'zod';
import { LANGS } from '../lib/i18n';

const lang = z.enum(LANGS).default('en');

// "airport", "city-center", "bus-station"
const locationKey = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{2,50}$/, { error: 'Invalid location' });

const modeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(['WALK', 'METRO', 'BUS', 'AIRPORT_EXPRESS', 'TAXI', 'TRAIN']));

export const routesQuerySchema = z.object({
  lang,
  from: locationKey.optional(),
  to: locationKey.optional(),
  mode: modeSchema.optional(),
  popular: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export const planQuerySchema = z
  .object({
    lang,
    from: locationKey,
    to: locationKey,
    people: z.coerce.number().int().min(1).max(20).default(1),
    sort: z.enum(['recommended', 'cheapest', 'fastest']).default('recommended'),
  })
  .refine((query) => query.from !== query.to, {
    error: 'Start and destination must be different',
    path: ['to'],
  });

export type RoutesQuery = z.infer<typeof routesQuerySchema>;
export type PlanQuery = z.infer<typeof planQuerySchema>;
