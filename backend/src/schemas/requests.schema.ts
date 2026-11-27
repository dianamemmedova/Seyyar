import * as z from 'zod';
import { LANGS } from '../lib/i18n';

const lang = z.enum(LANGS).default('en');

const date = z.iso.date({ error: 'Date must be in YYYY-MM-DD format' });
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Time must be in HH:MM format' });

const contact = {
  contactName: z.string().trim().min(2).max(100),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Invalid email address' })),
  contactPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, { error: 'Invalid phone number' }),
  contactWhatsapp: z.boolean().default(false),
  note: z.string().trim().max(1000).optional(),
  specialRequests: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
};

const hotelRequestSchema = z.object({
  type: z.literal('HOTEL'),
  placeSlug: z.string().trim().min(1),
  dateFrom: date,
  dateTo: date,
  guests: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(10).default(0),
  rooms: z
    .array(
      z.object({
        roomId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(5),
      }),
    )
    .min(1, { error: 'Select at least one room' })
    .max(10)
    .refine((rooms) => new Set(rooms.map((room) => room.roomId)).size === rooms.length, {
      error: 'Each room can be listed only once',
    }),
  ...contact,
});

const tableRequestSchema = z.object({
  type: z.literal('TABLE'),
  placeSlug: z.string().trim().min(1),
  date,
  time,
  guests: z.number().int().min(1).max(30),
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
        note: z.string().trim().max(200).optional(),
      }),
    )
    .max(50)
    .default([]),
  ...contact,
});

// "type" decides which of the two shapes is expected
export const createRequestSchema = z.discriminatedUnion('type', [
  hotelRequestSchema,
  tableRequestSchema,
]);

export const requestCodeParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^TRZ-\d{6}$/, { error: 'Invalid request code' }),
});

export const myRequestsQuerySchema = z.object({
  lang,
  status: z.enum(['active', 'past', 'cancelled']).optional(),
  type: z.enum(['HOTEL', 'TABLE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const requestLangQuerySchema = z.object({ lang });

export const createMessageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type HotelRequestInput = z.infer<typeof hotelRequestSchema>;
export type TableRequestInput = z.infer<typeof tableRequestSchema>;
export type MyRequestsQuery = z.infer<typeof myRequestsQuerySchema>;
