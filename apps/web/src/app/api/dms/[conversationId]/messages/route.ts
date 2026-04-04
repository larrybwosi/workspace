import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    const messages = await prisma.dmMessage.findMany({
      where: {
        dmId: conversationId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: true,
        reactions: true,
        attachments: true,
        readBy: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

    // Map DM message to look like a standard message for the frontend
    const formattedMessages = data.map((msg) => ({
      ...msg,
      userId: msg.senderId,
      user: {
        ...msg.sender,
        avatar: msg.sender.avatar || msg.sender.image
      },
      timestamp: msg.createdAt,
      reactions: msg.reactions.map(r => ({ ...r, users: [r.userId] })), // Simplified mapping
    }));

    return NextResponse.json({
      messages: formattedMessages.reverse(),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error(" Error fetching DM messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, replyToId, attachments } = body;

    const { message, dm } = await prisma.$transaction(async (tx) => {
      const msg = await tx.dmMessage.create({
        data: {
          dmId: conversationId,
          senderId: session.user.id,
          content,
          replyToId,
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
          sender: true,
          reactions: true,
          attachments: true,
        },
      });

      // Update user's message count
      await tx.user.update({
        where: { id: session.user.id },
        data: { messageCount: { increment: 1 } },
      });

      // Update last message timestamp
      const directMsg = await tx.directMessage.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return { message: msg, dm: directMsg };
    });

    const formattedMessage = {
      ...message,
      userId: message.senderId,
      user: {
        ...message.sender,
        avatar: message.sender.avatar || message.sender.image
      },
      timestamp: message.createdAt,
      reactions: message.reactions.map(r => ({ ...r, users: [r.userId] })),
    };

    // Notify the other user via Ably
    const otherUserId = dm.participant1Id === session.user.id ? dm.participant2Id : dm.participant1Id;
    const { publishToAbly, AblyEvents, AblyChannels } = await import("@/lib/integrations/ably");

    await publishToAbly(AblyChannels.user(otherUserId), AblyEvents.DM_RECEIVED, {
      dmId: conversationId,
      message: formattedMessage,
      from: session.user.name,
    });

    return NextResponse.json(formattedMessage, { status: 201 });
  } catch (error) {
    console.error(" Error creating DM message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
