import { NextRequest, NextResponse } from 'next/server';
import { forwardedForHeaders } from '@/lib/client-ip';
import { isSameOrigin } from '@/lib/proxy-rules';
import { API_BASE_URL, MEMBERSHIPS_COOKIE, SESSION_COOKIE } from '@/lib/session';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers.get('origin'), req.nextUrl.host)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    // Revoke the session on the server; clear the cookies even if this call fails.
    await fetch(`${API_BASE_URL}/v1/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${token}`, ...forwardedForHeaders(req.headers.get('x-forwarded-for')) } }).catch(() => undefined);
  }
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(MEMBERSHIPS_COOKIE);
  return res;
}
