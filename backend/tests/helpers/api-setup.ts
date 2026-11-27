import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { testOutbox } from '../../src/lib/mailer';

// Every test starts with an empty outbox
beforeEach(() => {
  testOutbox.length = 0;
});

// Close the database connection when a test file is done
afterAll(async () => {
  await prisma.$disconnect();
});
