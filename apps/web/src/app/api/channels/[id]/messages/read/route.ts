import { headers } from "next/headers";
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params;
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageIds } = body;

    if (!Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Invalid messageIds' }, { status: 400 });
    }

    const readPromises = messageIds.map((messageId) =>
      prisma.messageRead.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId: session.user.id,
          },
        },
        update: {
          readAt: new Date(),
        },
        create: {
          messageId,
          userId: session.user.id,
          readAt: new Date(),
        },
      })
    );

    await Promise.all(readPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Batch read error:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
