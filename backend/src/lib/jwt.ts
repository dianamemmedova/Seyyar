import jwt from 'jsonwebtoken';
import type { Role } from '../generated/prisma/client';
import { config } from '../config';

const ALGORITHM = 'HS256' as const;

export type AccessTokenPayload = {
  userId: number;
  role: Role;
};

export function signAccessToken({ userId, role }: AccessTokenPayload): string {
  return jwt.sign({ role }, config.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: config.JWT_ACCESS_TTL_SECONDS,
    subject: String(userId),
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: [ALGORITHM] });

  if (typeof decoded === 'string' || !decoded.sub || typeof decoded.role !== 'string') {
    throw new jwt.JsonWebTokenError('Unexpected token payload');
  }

  return { userId: Number(decoded.sub), role: decoded.role as Role };
}

export const { TokenExpiredError } = jwt;
