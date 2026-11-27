import 'dotenv/config';
import * as z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce
    .number({ error: 'PORT rəqəm olmalıdır' })
    .int()
    .min(1)
    .max(65535)
    .default(4000),
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
