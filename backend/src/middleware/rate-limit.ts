import { rateLimit } from 'express-rate-limit';
import { TooManyRequestsError } from '../lib/errors';

// 10 failed login attempts per IP in 15 minutes (successful logins are not counted)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many failed login attempts. Try again in 15 minutes'));
  },
});

// 10 registrations per IP per hour
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many registrations from this IP. Try again in 1 hour'));
  },
});
