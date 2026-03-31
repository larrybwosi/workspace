import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getAblyRest, AblyChannels, AblyEvents } from '@/lib/integrations/ably';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string }> }
) {
  try {
    const { workspaceId, channelId, messageId } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
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
    const { content } = body;

    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
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
      await channel.publish(AblyEvents.MESSAGE_UPDATED, message);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Message update error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string }> }
) {
  try {
    const { workspaceId, channelId, messageId } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
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

    await prisma.message.delete({
      where: { id: messageId },
    });

    const ably = getAblyRest(); if (!ably) return NextResponse.json({ error: "Ably not configured" }, { status: 500 });;
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_DELETED, { id: messageId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
