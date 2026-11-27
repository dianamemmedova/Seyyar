import pg from 'pg';
import { loadTestEnv } from './test-env';

// Runs once before all API tests: checks that the test database exists and has tables
export default async function globalSetup() {
  const { DATABASE_URL } = loadTestEnv();
  const client = new pg.Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
  } catch (error) {
    throw new Error(
      `Test bazasına qoşulmaq olmadı. pgAdmin-də seyyar_test yaradılıb? (${(error as Error).message})`,
    );
  }

  try {
    const result = await client.query(`SELECT to_regclass('public.users') AS users_table`);
    if (!result.rows[0].users_table) {
      throw new Error('Test bazasında cədvəllər yoxdur. Əvvəlcə bunu işlət: npm run test:db');
    }
  } finally {
    await client.end();
  }
}
