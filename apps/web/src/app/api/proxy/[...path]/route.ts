import { NextRequest, NextResponse } from 'next/server';
import { forwardedForHeaders } from '@/lib/client-ip';
import { isAllowedPath, isSameOrigin } from '@/lib/proxy-rules';
import { API_BASE_URL, SESSION_COOKIE } from '@/lib/session';

type Ctx = { params: Promise<{ path: string[] }> };

// Browser calls go through here so the bearer token stays in an httpOnly cookie.
// Only allow-listed API areas are reachable, and state-changing requests must come from this site.
async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  if (!isAllowedPath(path)) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  if (req.method !== 'GET' && !isSameOrigin(req.headers.get('origin'), req.nextUrl.host)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const headers: Record<string, string> = { ...forwardedForHeaders(req.headers.get('x-forwarded-for')) };
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) headers.authorization = `Bearer ${token}`;
  const contentType = req.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  const upstream = await fetch(`${API_BASE_URL}/v1/${path.join('/')}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body: req.method === 'GET' ? undefined : await req.text(),
    cache: 'no-store',
  });

  if (upstream.status === 204) return new NextResponse(null, { status: 204 });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

export { handle as GET, handle as POST };
