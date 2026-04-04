import { headers } from "next/headers";
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string }> }
) {
  try {
    const { workspaceId, channelId } = await params;
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { messageIds } = body;

    if (!Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Invalid messageIds' }, { status: 400 });
    }

    // Mark messages as read by the current user
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
