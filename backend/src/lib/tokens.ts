import { createHash, randomBytes } from 'node:crypto';

// Long random string (64 characters), impossible to guess
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

// Only the hash is stored in the database; a leaked database does not leak usable tokens
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
