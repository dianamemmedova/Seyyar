import { rateLimit } from 'express-rate-limit';
import { TooManyRequestsError } from '../lib/errors';

// Every API call: 300 per IP in 15 minutes (a normal visitor never gets close)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many requests. Try again in a few minutes'));
  },
});

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

// 20 new booking / table requests per IP per hour (stops spam to partners)
export const createRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many requests sent. Try again in 1 hour'));
  },
});

// 5 password reset emails per IP per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many password reset attempts. Try again in 1 hour'));
  },
});

// 30 upload calls per IP per hour (each call can carry up to 5 images)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many uploads. Try again in 1 hour'));
  },
});

// Public forms (contact, subscribe, partner application): 10 per IP per hour
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many form submissions. Try again in 1 hour'));
  },
});
