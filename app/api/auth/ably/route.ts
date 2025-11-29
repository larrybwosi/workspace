// app/api/ably-auth/route.ts
import { NextResponse } from 'next/server';
import { ably } from '@/lib/ably';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
// console.log(session)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  try {
      const tokenRequest = await ably.auth.requestToken({
        clientId: userId,
        // Capability must be a JSON stringified object
        capability: JSON.stringify({
          'order-*': ['subscribe', 'publish'],
          'cashier-notifications': ['subscribe'],
          'channel:*': ['subscribe', 'publish', 'history'],
          'session:*': ['subscribe', 'publish', 'history'],
        }),
        ttl: 3600 * 1000, // 1 hour in milliseconds
        timestamp: Date.now(),
      });
    return NextResponse.json(tokenRequest);
  } catch (error) {
    // console.error('Error creating Ably token request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
