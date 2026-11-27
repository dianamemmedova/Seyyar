import 'dotenv/config';
import * as z from 'zod';

// In .env an empty value (SMTP_HOST=) means "not set"
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce
    .number({ error: 'PORT rəqəm olmalıdır' })
    .int()
    .min(1)
    .max(65535)
    .default(5050),
  DATABASE_URL: z
    .string({ error: 'DATABASE_URL yoxdur' })
    .regex(/^postgres(ql)?:\/\//, { error: 'DATABASE_URL postgresql:// ilə başlamalıdır' }),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter((origin) => origin.length > 0),
    ),
  JWT_SECRET: z
    .string({ error: 'JWT_SECRET yoxdur' })
    .min(32, { error: 'JWT_SECRET ən azı 32 simvol olmalıdır' })
    .refine((secret) => !secret.startsWith('CHANGE_ME'), {
      error: 'JWT_SECRET hələ də nümunədir — öz secret-ini yaz',
    }),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).default(30),

  // Address of the tourist website (used in links inside emails)
  APP_WEB_URL: z.url({ error: 'APP_WEB_URL düzgün URL deyil' }).default('http://localhost:4200'),

  // Email (SMTP). Without SMTP_HOST, emails are printed to the terminal (development)
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().default(587)),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().optional()),
  MAIL_FROM: z.string().default('Seyyar <no-reply@seyyar.local>'),
  // Receives request emails for places that have no email of their own
  ADMIN_NOTIFY_EMAIL: z.preprocess(
    emptyToUndefined,
    z.email({ error: 'ADMIN_NOTIFY_EMAIL düzgün e-poçt deyil' }).optional(),
  ),
});

export type Config = z.infer<typeof envSchema>;

export function parseEnv(env: Record<string, string | undefined>): Config {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(['Env konfiqurasiyası yanlışdır:', ...lines].join('\n'));
  }

  return result.data;
}

export const config = parseEnv(process.env);

export const isProduction = config.NODE_ENV === 'production';
