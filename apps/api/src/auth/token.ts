import { createHash, randomBytes } from 'node:crypto';

// Sessions use opaque random tokens. Only the SHA-256 hash is stored, so a database leak does not expose live sessions.
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}
