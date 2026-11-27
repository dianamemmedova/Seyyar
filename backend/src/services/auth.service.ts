import bcrypt from 'bcryptjs';
import type { Role } from '../generated/prisma/client';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { signAccessToken } from '../lib/jwt';
import { generateSecureToken, hashToken } from '../lib/tokens';
import { sendMailInBackground } from '../lib/mailer';
import { passwordResetForUser } from '../emails/templates';
import { isPrismaError, PrismaErrorCode } from '../lib/prisma-errors';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../lib/errors';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Used when the email does not exist, so a wrong email takes as long as a wrong password
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);

// Fields that are safe to send to the client (never passwordHash)
export const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  language: true,
  currency: true,
  createdAt: true,
} as const;

export type PublicUser = {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  language: string;
  currency: string;
  createdAt: Date;
};

export type Session = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};

async function createSession(user: PublicUser): Promise<Session> {
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateSecureToken();
  const refreshExpiresAt = new Date(
    Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiresAt },
  });

  return { user, accessToken, refreshToken, refreshExpiresAt };
}

export async function registerUser(input: RegisterInput): Promise<Session> {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        phone: input.phone ?? null,
        passwordHash,
      },
      select: publicUserSelect,
    });
    return await createSession(user);
  } catch (error: unknown) {
    if (isPrismaError(error, PrismaErrorCode.UNIQUE_VIOLATION)) {
      throw new ConflictError('This email is already registered', 'EMAIL_TAKEN');
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<Session> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true, isBlocked: true },
  });

  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    throw new UnauthorizedError('Email or password is incorrect', 'INVALID_CREDENTIALS');
  }

  if (user.isBlocked) {
    throw new ForbiddenError('This account is blocked', 'ACCOUNT_BLOCKED');
  }

  const { passwordHash: _passwordHash, isBlocked: _isBlocked, ...publicUser } = user;
  return createSession(publicUser);
}

export async function refreshSession(rawToken: string | undefined): Promise<Session> {
  if (!rawToken) {
    throw new UnauthorizedError('Refresh token is missing', 'REFRESH_TOKEN_MISSING');
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { ...publicUserSelect, isBlocked: true } } },
  });

  if (!stored) {
    throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  // A revoked token used again means it was probably stolen: log the user out everywhere
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
  }

  if (stored.user.isBlocked) {
    throw new ForbiddenError('This account is blocked', 'ACCOUNT_BLOCKED');
  }

  // Rotation: the old refresh token can be used only once
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const { isBlocked: _isBlocked, ...publicUser } = stored.user;
  return createSession(publicUser);
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

// ─────────────────────────────────────────────
// Forgot / reset password
// ─────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true, isBlocked: true },
  });

  // Same answer whether the email exists or not, so nobody can check who is registered
  if (!user || user.isBlocked) return;

  const token = generateSecureToken();

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  sendMailInBackground(passwordResetForUser(user.email, user.fullName, token));
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const stored = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
    throw new BadRequestError('This reset link is invalid or has expired', 'INVALID_RESET_TOKEN');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date();

  // All three together: new password, link used up, logged out everywhere
  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: now } }),
    prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
}
