import { headers } from "next/headers";
import { NextResponse } from 'next/server';
import { ably } from '@/lib/integrations/ably';
import { auth } from '@/lib/auth';

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() } as any);
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
        'channel:*': ['subscribe', 'publish', 'history', 'presence'],
        'session:*': ['subscribe', 'publish', 'history', 'presence'],
        'workspace:*': ['subscribe', 'publish', 'history', 'presence'],
        'user:*': ['subscribe', 'publish', 'history', 'presence'],
        'notifications:*': ['subscribe', 'publish', 'history', 'presence'],
        'thread:*': ['subscribe', 'publish', 'history', 'presence'],
        'dm:*': ['subscribe', 'publish', 'history', 'presence'],
        'presence:*': ['subscribe', 'publish', 'history', 'presence'],
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
