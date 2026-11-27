import * as z from 'zod';
import { LANGS } from '../lib/i18n';
import { placeTypeSchema } from './places.schema';

export const favoritesQuerySchema = z.object({
  lang: z.enum(LANGS).default('en'),
  type: placeTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type FavoritesQuery = z.infer<typeof favoritesQuerySchema>;
