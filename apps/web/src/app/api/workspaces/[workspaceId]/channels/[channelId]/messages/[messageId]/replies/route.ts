import { headers } from "next/headers";
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getAblyRest, AblyChannels, AblyEvents } from '@/lib/integrations/ably';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string }> }
) {
  try {
    const { workspaceId, channelId, messageId } = await params;
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
    const { content, attachments } = body;

    const reply = await prisma.message.create({
      data: {
        channelId,
        userId: session.user.id,
        content,
        replyToId: messageId,
        depth: 1,
        attachments: attachments
          ? {
              create: attachments.map((att: any) => ({
                name: att.name,
                type: att.type,
                url: att.url,
                size: att.size,
              })),
            }
          : undefined,
      },
      include: {
        user: true,
        reactions: true,
        attachments: true,
        mentions: true,
      },
    });

    const ably = getAblyRest(); if (!ably) return NextResponse.json({ error: "Ably not configured" }, { status: 500 });;
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_SENT, reply);
    }

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error('Reply creation error:', error);
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
  }
}
