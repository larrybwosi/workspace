import { headers } from "next/headers";
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getAblyRest, AblyChannels, AblyEvents } from '@/lib/integrations/ably';
import {
  extractUserMentions,
  extractUserIds,
  hasSpecialMention,
  extractChannelMentions,
} from '@/lib/utils/mention-utils';
import { notifyMention, notifyChannel } from '@/lib/notifications/notifications';

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        channel: { workspaceId },
        ...(cursor ? { timestamp: { lt: new Date(cursor) } } : {}),
      },
      include: {
        user: true,
        reactions: true,
        attachments: true,
        mentions: true,
        readBy: true,
        replies: {
          include: {
            user: true,
            reactions: true,
            readBy: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? data[data.length - 1].timestamp.toISOString() : null;

    return NextResponse.json({
      messages: data.reverse(),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error(' Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

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
    const { content, messageType, metadata, replyToId, attachments } = body;

    const userMentions = extractUserMentions(content);
    const channelMentions = extractChannelMentions(content);
    const mentionsAll = hasSpecialMention(content, 'all');
    const mentionsHere = hasSpecialMention(content, 'here');

    const users = await prisma.user.findMany();
    const mentionedUserIds = extractUserIds(userMentions, users);

    const message = await prisma.message.create({
      data: {
        channelId,
        userId: session.user.id,
        content,
        messageType: messageType || 'standard',
        metadata,
        replyToId,
        depth: replyToId ? 1 : 0,
        mentions: {
          create: [
            ...userMentions.map((mention: string) => ({ mention })),
            ...channelMentions.map((mention: string) => ({ mention: `#${mention}` })),
            ...(mentionsAll ? [{ mention: '@all' }] : []),
            ...(mentionsHere ? [{ mention: '@here' }] : []),
          ],
        },
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

    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // Notify specific users
    for (const mentionedUserId of mentionedUserIds) {
      if (mentionedUserId !== session.user.id) {
        await notifyMention(message.id, mentionedUserId, sender?.name || 'Someone', channelId, content);
      }
    }

    // Notify @all / @here
    if (mentionsAll || mentionsHere) {
      await notifyChannel(channelId, sender?.name || 'Someone', message.id, content, mentionsHere);
    }

    const ably = getAblyRest(); if (!ably) return NextResponse.json({ error: "Ably not configured" }, { status: 500 });;
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_SENT, message);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error(' Message creation error:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
