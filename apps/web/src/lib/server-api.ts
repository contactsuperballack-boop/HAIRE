import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { forwardedForHeaders } from './client-ip';
import { API_BASE_URL, SESSION_COOKIE } from './session';

// Headers every server-side API call should carry so the API sees the real client address.
export async function forwardedHeaders(): Promise<Record<string, string>> {
  return forwardedForHeaders((await headers()).get('x-forwarded-for'));
}

// Server-side reads. The session token stays in an httpOnly cookie and never reaches browser JavaScript.
export async function api<T>(path: string): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const res = await fetch(`${API_BASE_URL}/v1/${path}`, {
    headers: { ...(await forwardedHeaders()), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (res.status === 404 || res.status === 400) notFound();
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}
