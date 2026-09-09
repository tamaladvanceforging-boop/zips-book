import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('zips_session_token')?.value;

  // Protected paths that require login
  const isProtected = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/vouchers') ||
    pathname.startsWith('/masters') ||
    pathname.startsWith('/registers') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/company') ||
    pathname.startsWith('/companies');

  if (isProtected && !sessionToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
