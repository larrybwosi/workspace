import { NextResponse, type NextRequest } from 'next/server';
import { validateEnv } from '@repo/shared';

const publicRoutes = [
  '/login',
  '/signup',
  '/widget',
  '/invite',
  '/api/invitations',
  '/api/health',
  '/api/device-auth',
  '/privacy',
  '/terms',
  '/forgot-password',
  '/sw.js',
  '/firebase-messaging-sw.js',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icon.png',
  '/icon_any.webp',
  '/icon_maskable.webp',
];
const authPrefix = '/api/auth';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  if (isPublicRoute || pathname.startsWith(authPrefix)) {
    return NextResponse.next();
  }

  let session = null;
  try {
    const { auth } = await import('@/lib/auth');

    // Convert Headers to a plain object
    const plainHeaders = Object.fromEntries(request.headers.entries());

    // Extract Bearer token and set it in cookie headers so getSession finds it
    const authHeader = plainHeaders['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        let cookieHeader = plainHeaders['cookie'] || '';
        if (cookieHeader && !cookieHeader.endsWith(';')) {
          cookieHeader += ';';
        }
        cookieHeader += ` better-auth.session_token=${token}; better-auth.session-token=${token}; bearer_token=${token}`;
        plainHeaders['cookie'] = cookieHeader;
      }
    }

    session = await auth.api.getSession({
      headers: plainHeaders as any,
    });
  } catch (err) {
    console.error(`[Proxy] Session retrieval error on path ${pathname}:`, err);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Service Unavailable', details: 'Database or authentication connection failed' },
        { status: 503 }
      );
    }
    // For non-API routes, let's redirect to login if database or auth is down
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!session) {
    console.warn(`[Proxy] Session verification failed for path: ${pathname}`);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.info(`[Proxy] Session verified successfully for path: ${pathname}`);
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
