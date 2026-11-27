import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

// Tests always use .env.test (a separate database), never .env
export function loadTestEnv(): Record<string, string> {
  if (!existsSync('.env.test')) {
    throw new Error('.env.test tapılmadı. Nümunədən yarat: copy .env.test.example .env.test');
  }

  const env = parse(readFileSync('.env.test'));
  const databaseName = new URL(env.DATABASE_URL ?? 'postgresql://x/missing').pathname.slice(1);

  // Safety net: tests delete all data, so never point them at a real database
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Testlər "${databaseName}" bazasını silərdi! .env.test-də DATABASE_URL adı _test ilə bitən baza olmalıdır.`,
    );
  }

  return env;
}
