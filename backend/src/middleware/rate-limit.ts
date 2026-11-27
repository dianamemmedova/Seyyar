import { rateLimit } from 'express-rate-limit';
import { config } from '../config';
import { TooManyRequestsError } from '../lib/errors';

type LimiterOptions = {
  windowMinutes: number;
  limit: number;
  message: string;
  // Count only failed attempts (used for login)
  skipSuccessfulRequests?: boolean;
};

// All limiters share the same settings; only the numbers and the message differ.
// Automated tests send hundreds of requests from one IP, so limits are off in tests.
function createLimiter({ windowMinutes, limit, message, skipSuccessfulRequests }: LimiterOptions) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => config.NODE_ENV === 'test',
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError(message));
    },
  });
}

// Every API call: 300 per IP in 15 minutes (a normal visitor never gets close)
export const apiLimiter = createLimiter({
  windowMinutes: 15,
  limit: 300,
  message: 'Too many requests. Try again in a few minutes',
});

// 10 failed login attempts per IP in 15 minutes (successful logins are not counted)
export const loginLimiter = createLimiter({
  windowMinutes: 15,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Try again in 15 minutes',
});

// 10 registrations per IP per hour
export const registerLimiter = createLimiter({
  windowMinutes: 60,
  limit: 10,
  message: 'Too many registrations from this IP. Try again in 1 hour',
});

// 20 new booking / table requests per IP per hour (stops spam to partners)
export const createRequestLimiter = createLimiter({
  windowMinutes: 60,
  limit: 20,
  message: 'Too many requests sent. Try again in 1 hour',
});

// 5 password reset emails per IP per hour
export const passwordResetLimiter = createLimiter({
  windowMinutes: 60,
  limit: 5,
  message: 'Too many password reset attempts. Try again in 1 hour',
});

// 30 upload calls per IP per hour (each call can carry up to 5 images)
export const uploadLimiter = createLimiter({
  windowMinutes: 60,
  limit: 30,
  message: 'Too many uploads. Try again in 1 hour',
});

// Public forms (contact, subscribe, partner application): 10 per IP per hour
export const formLimiter = createLimiter({
  windowMinutes: 60,
  limit: 10,
  message: 'Too many form submissions. Try again in 1 hour',
});
