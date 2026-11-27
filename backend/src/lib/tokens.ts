import { createHash, randomBytes } from 'node:crypto';

// Long random string (64 characters), impossible to guess.
// Used for refresh tokens and password reset links.
export function generateSecureToken(): string {
  return randomBytes(48).toString('base64url');
}

// Only the hash is stored in the database; a leaked database does not leak usable tokens
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
