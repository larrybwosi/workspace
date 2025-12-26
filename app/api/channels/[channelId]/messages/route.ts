import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/ably"
import { extractMentions, extractUserIds } from "@/lib/mention-utils"
import { notifyMention } from "@/lib/notifications"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { channelId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.isPrivate && channel.members.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const messages = await prisma.message.findMany({
      where: {
        channelId: channelId, // Direct link to channel
        threadId: undefined,       // Only fetch "Root" messages (exclude sidebar replies)
        ...(cursor ? { timestamp: { lt: new Date(cursor) } } : {}),
      },
      include: {
        user: true,
        reactions: true,
        attachments: true,
        mentions: true,
        readBy: true,
        // In a "Stream-first" view, we usually only fetch the count of replies or
        // the last reply, rather than full reply objects, but keeping your existing include
        // structure for compatibility:
        replies: {
          include: {
            user: true,
            reactions: true,
            readBy: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc", // Changed from timestamp to timestamp (standard Prisma field)
      },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore
      ? data[data.length - 1].timestamp.toISOString()
      : null;

    const processedMessages = data.map((message) => {
      const readByCurrentUser = message.readBy.some(
        (read) => read.userId === currentUserId
      );

      const processedReplies = message.replies.map((reply) => {
        const replyReadByCurrentUser = reply.readBy.some(
          (read) => read.userId === currentUserId
        );
        return {
          ...reply,
          readByCurrentUser: replyReadByCurrentUser,
        };
      });

      return {
        ...message,
        readByCurrentUser: readByCurrentUser,
        replies: processedReplies,
      };
    });

    console.log("Fetched messages for channel:", processedMessages);
    return NextResponse.json({
      messages: processedMessages.reverse(),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error(" Error fetching channel messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await params
    const body = await request.json()
    // UPDATED: Added threadId to body destructuring
    const { content, messageType, metadata, replyToId, mentions, attachments, threadId } = body

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    if (channel.isPrivate && channel.members.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // UPDATED: Removed automatic "General Thread" creation logic.

    const detectedMentions = mentions || extractMentions(content)
    const users = await prisma.user.findMany()
    const mentionedUserIds = extractUserIds(detectedMentions, users)

    const message = await prisma.message.create({
      data: {
        channelId: channelId, // UPDATED: Link directly to channel
        threadId: threadId || null, // UPDATED: Only set if this is a sidebar reply
        userId: session.user.id,
        content,
        messageType: messageType || "standard",
        metadata,
        replyToId,
        // Depth logic: If it's in a thread or has a parent, it's depth 1 (simplified)
        depth: (threadId || replyToId) ? 1 : 0, 
        mentions: detectedMentions.length > 0
          ? {
              create: detectedMentions.map((mention: string) => ({ mention })),
            }
          : undefined,
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
    })

    const mentionedByUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    for (const mentionedUserId of mentionedUserIds) {
      if (mentionedUserId !== session.user.id) {
        await notifyMention(
          message.id,
          mentionedUserId,
          mentionedByUser?.name || "Someone",
          threadId || channelId, // UPDATED: Context is thread if exists, else channel
          content
        )
      }
    }

    const ably = getAblyRest()
    const ablyChannel = ably.channels.get(AblyChannels.channel(channelId))
    await ablyChannel.publish(AblyEvents.MESSAGE_SENT, message)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error(" Channel message creation error:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}