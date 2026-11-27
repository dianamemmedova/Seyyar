import * as z from 'zod';

const email = z
  .string({ error: 'Email must be a string' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Invalid email address' }));

const password = z
  .string({ error: 'Password must be a string' })
  .min(8, { error: 'Password must be at least 8 characters' })
  .regex(/[A-Za-z]/, { error: 'Password must contain at least one letter' })
  .regex(/\d/, { error: 'Password must contain at least one digit' })
  // bcrypt only uses the first 72 bytes of a password
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    error: 'Password is too long',
  });

export const registerSchema = z.object({
  fullName: z
    .string({ error: 'Full name must be a string' })
    .trim()
    .min(2, { error: 'Full name must be at least 2 characters' })
    .max(100, { error: 'Full name must be at most 100 characters' }),
  email,
  password,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, { error: 'Invalid phone number' })
    .optional(),
});

export const loginSchema = z.object({
  email,
  password: z
    .string({ error: 'Password must be a string' })
    .min(1, { error: 'Password is required' }),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
