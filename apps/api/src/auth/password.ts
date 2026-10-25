import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// scrypt with a per-password salt. Stored as scrypt$N$r$p$salt$hash (base64) so parameters can be raised later.
const N = 2 ** 17;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAX_N = 2 ** 20;

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEYLEN, { N: n, r, p, maxmem: 256 * n * r + 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || n < 2 || n > MAX_N || !Number.isInteger(r) || r < 1 || !Number.isInteger(p) || p < 1) return false;
  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  if (expected.length === 0) return false;
  const actual = await derive(password, salt, n, r, p);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
