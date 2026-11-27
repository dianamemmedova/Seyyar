import { defineConfig } from 'vitest/config';
import { loadTestEnv } from './tests/helpers/test-env.ts';

export default defineConfig({
  test: {
    env: loadTestEnv(),
    // Test files share one database, so they run one after another
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'api',
          include: ['tests/api/**/*.test.ts'],
          globalSetup: ['tests/helpers/global-setup.ts'],
          setupFiles: ['tests/helpers/api-setup.ts'],
        },
      },
    ],
  },
});
