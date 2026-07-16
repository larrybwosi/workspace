import { NextResponse, type NextRequest } from 'next/server';
import { validateEnv } from '@repo/shared';

const publicRoutes = ['/login', '/signup', '/widget', '/invite', '/api/invitations', '/api/health'];
const authPrefix = '/api/auth';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  if (isPublicRoute || pathname.startsWith(authPrefix)) {
    return NextResponse.next();
  }

  // Load auth dynamically so that public routes (like /api/health) and simple routes
  // do not trigger Better Auth / Database connection failures or environment validations.
  const { auth } = await import('@/lib/auth');

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
