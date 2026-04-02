import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token');

  // Paths that don't require authentication
  const publicPaths = ['/login', '/forgot-password', '/reset-password'];

  let isPublicPath = false;
  for (const path of publicPaths) {
    if (request.nextUrl.pathname.startsWith(path)) {
      isPublicPath = true;
      break;
    }
  }

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
