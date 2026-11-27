// npm run test:db — creates / updates the tables in the test database (seyyar_test)
import { execSync } from 'node:child_process';
import { loadTestEnv } from './helpers/test-env';

const { DATABASE_URL } = loadTestEnv();

execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL },
});
