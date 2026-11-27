import 'dotenv/config';
import * as z from 'zod';

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
