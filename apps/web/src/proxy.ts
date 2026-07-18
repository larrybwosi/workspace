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

  // Clone request headers into standard Web Headers to allow mutation
  const headers = new Headers(request.headers);

  // Extract the Authorization header (Web Headers handles case-insensitivity automatically)
  const authHeader = headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      console.info(`[Proxy] Bearer token detected. Injecting better-auth session cookies.`);
      const cookieValue = headers.get('cookie') || '';
      const cookieNameUnderscore = 'better-auth.session_token';
      const cookieNameHyphen = 'better-auth.session-token';

      // Inject the session tokens into the cookie header if they aren't already present
      let updatedCookie = cookieValue;
      if (!cookieValue.includes(cookieNameUnderscore)) {
        updatedCookie = updatedCookie ? `${updatedCookie}; ${cookieNameUnderscore}=${token}` : `${cookieNameUnderscore}=${token}`;
      }
      if (!cookieValue.includes(cookieNameHyphen)) {
        updatedCookie = updatedCookie ? `${updatedCookie}; ${cookieNameHyphen}=${token}` : `${cookieNameHyphen}=${token}`;
      }
      headers.set('cookie', updatedCookie);
    }
  }

  const plainHeaders = Object.fromEntries(headers.entries());
  const session = await auth.api.getSession({
    headers: plainHeaders,
  });

  if (!session) {
    console.warn(`[Proxy] Session verification failed for path: ${pathname}`);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.info(`[Proxy] Session verified successfully for path: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
