import { NextRequest, NextResponse } from 'next/server';
import { forwardedForHeaders } from '@/lib/client-ip';
import { isSameOrigin } from '@/lib/proxy-rules';
import { API_BASE_URL, MEMBERSHIPS_COOKIE, SESSION_COOKIE, cookieOptions } from '@/lib/session';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers.get('origin'), req.nextUrl.host)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const upstream = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...forwardedForHeaders(req.headers.get('x-forwarded-for')) },
    body: await req.text(),
    cache: 'no-store',
  });

  if (upstream.status === 429) return NextResponse.json({ message: 'Too many attempts. Wait a minute and try again.' }, { status: 429 });
  if (!upstream.ok) return NextResponse.json({ message: 'Invalid email or password' }, { status: upstream.status === 400 ? 400 : 401 });

  const { token, memberships } = (await upstream.json()) as { token: string; memberships: unknown[] };
  const res = NextResponse.json({ memberships });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
  res.cookies.set(MEMBERSHIPS_COOKIE, JSON.stringify(memberships), cookieOptions);
  return res;
}
