import { toApiError } from '@seyyar/shared';

// API error codes that have their own text in i18n/*.json ("errors.EMAIL_TAKEN" ...)
const KNOWN = new Set([
  'INVALID_CREDENTIALS',
  'EMAIL_TAKEN',
  'ACCOUNT_BLOCKED',
  'INVALID_RESET_TOKEN',
  'TOO_MANY_REQUESTS',
  'NETWORK_ERROR',
  'REQUEST_CLOSED',
  'INVALID_STATUS_TRANSITION',
  'REVIEW_EXISTS',
  'REVIEW_NOT_ALLOWED',
]);

// Any HTTP error -> translation key for the message shown to the user
export function errorKey(error: unknown): string {
  const { code } = toApiError(error);
  return KNOWN.has(code) ? `errors.${code}` : 'common.error';
}
