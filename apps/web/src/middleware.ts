import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

// A fast redirect for signed-out visitors. The API still checks every request; this is not the security boundary.
export function middleware(req: NextRequest) {
  if (!req.cookies.get(SESSION_COOKIE)) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/jobs/:path*', '/applications/:path*', '/workspaces'] };
