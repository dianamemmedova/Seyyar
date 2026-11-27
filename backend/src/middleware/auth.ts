import type { RequestHandler } from 'express';
import type { Role } from '../generated/prisma/client';
import { TokenExpiredError, verifyAccessToken } from '../lib/jwt';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');

  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(new UnauthorizedError('Access token expired', 'TOKEN_EXPIRED'));
      return;
    }
    next(new UnauthorizedError('Invalid access token', 'INVALID_TOKEN'));
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
