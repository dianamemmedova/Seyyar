import * as z from 'zod';
import { LANGS } from '../lib/i18n';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Invalid email address' }));
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,20}$/, { error: 'Invalid phone number' });

// Hidden field on the website forms. People never see it, spam bots fill it in.
const honeypot = z.string().optional();

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  message: z.string().trim().min(10, { error: 'Message must be at least 10 characters' }).max(3000),
  website: honeypot,
});

export const subscribeSchema = z.object({
  email,
  interest: z.enum(['REGIONS', 'NEWS']).default('REGIONS'),
});

export const partnerApplicationSchema = z.object({
  businessType: z.enum(['HOTEL', 'RESTAURANT', 'GUEST_HOUSE', 'ATTRACTION']),
  businessName: z.string().trim().min(2).max(150),
  // Azerbaijani tax number: 10 digits
  voen: z
    .string()
    .trim()
    .regex(/^\d{10}$/, { error: 'VOEN must be 10 digits' }),
  address: z.string().trim().min(5).max(300),
  contactName: z.string().trim().min(2).max(100),
  phone,
  email,
  website: honeypot,
});

export const faqQuerySchema = z.object({
  lang: z.enum(LANGS).default('en'),
  category: z.string().trim().toLowerCase().max(50).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;
export type FaqQuery = z.infer<typeof faqQuerySchema>;
