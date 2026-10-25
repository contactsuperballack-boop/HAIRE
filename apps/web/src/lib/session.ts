export const SESSION_COOKIE = 'haire_session';
export const MEMBERSHIPS_COOKIE = 'haire_memberships';
export const SESSION_MAX_AGE_S = 12 * 60 * 60;

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE_S,
};

export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
