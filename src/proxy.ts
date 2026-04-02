import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const publicRoutes = ['/login', '/signup', '/widget', '/invite', '/api/invitations'];
const authPrefix = '/api/auth';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute || pathname.startsWith(authPrefix)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
