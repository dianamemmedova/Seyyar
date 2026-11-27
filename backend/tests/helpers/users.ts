import bcrypt from 'bcryptjs';
import type { Role } from '../../src/generated/prisma/client';
import { prisma } from '../../src/lib/prisma';
import { signAccessToken } from '../../src/lib/jwt';

export const TEST_PASSWORD = 'Password123';

// Hashing once is enough: every test user gets the same password
const passwordHash = bcrypt.hashSync(TEST_PASSWORD, 4);

let counter = 0;

type UserOptions = { role?: Role; email?: string; fullName?: string; isBlocked?: boolean };

// Creates a user directly in the database and returns it with a ready access token
export async function createUser(options: UserOptions = {}) {
  counter += 1;

  const user = await prisma.user.create({
    data: {
      email: options.email ?? `user${counter}@seyyar.test`,
      fullName: options.fullName ?? `Test User${counter}`,
      role: options.role ?? 'TOURIST',
      isBlocked: options.isBlocked ?? false,
      passwordHash,
    },
  });

  const token = signAccessToken({ userId: user.id, role: user.role });

  return { user, token, auth: { Authorization: `Bearer ${token}` } };
}
