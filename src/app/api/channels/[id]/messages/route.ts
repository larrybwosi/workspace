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
import { isUserEligibleForAsset, logAssetUsage } from '@/lib/assets/asset-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(cursor ? { timestamp: { lt: new Date(cursor) } } : {}),
      },
      include: {
        user: true,
        reactions: true,
        attachments: true,
        mentions: true,
        readBy: true,
        replyTo: {
          include: {
            user: true,
          },
        },
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, content, messageType, metadata, replyToId, attachments, stickerId } = body;

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
    }

    const userMentions = extractUserMentions(content);
    const channelMentions = extractChannelMentions(content);
    const mentionsAll = hasSpecialMention(content, 'all');
    const mentionsHere = hasSpecialMention(content, 'here');

    const users = await prisma.user.findMany();
    const mentionedUserIds = extractUserIds(userMentions, users);

    // Eligibility check for stickers
    if (stickerId) {
      const sticker = await prisma.sticker.findUnique({ where: { id: stickerId } });
      if (sticker && sticker.rules) {
        const isEligible = await isUserEligibleForAsset(session.user.id, sticker.rules);
        if (!isEligible) {
          return NextResponse.json({ error: "Not eligible to use this sticker" }, { status: 403 });
        }
      }
      await logAssetUsage({
        assetId: stickerId,
        assetType: 'sticker',
        userId: session.user.id,
        workspaceId: sticker?.workspaceId || undefined
      });
    }

    const message = await prisma.$transaction(async (tx) => {
      // 1. Create the message
      const msg = await tx.message.create({
        data: {
          channelId,
          userId: session.user.id,
          content,
          messageType: messageType || 'standard',
          metadata: { ...metadata, stickerId },
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

      // 2. Increment user's message count
      await tx.user.update({
        where: { id: session.user.id },
        data: { messageCount: { increment: 1 } },
      });

      return msg;
    });

    const sender = message.user;

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
