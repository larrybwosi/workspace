import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/ably"
import { extractMentions, extractUserIds } from "@/lib/mention-utils"
import { notifyMention } from "@/lib/notifications"

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor")
    const limit = parseInt(searchParams.get("limit") || "50")

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

    let thread = await prisma.thread.findFirst({
      where: {
        channelId,
        title: `${channel.name} General`,
      },
    })

    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          channelId,
          title: `${channel.name} General`,
          creatorId: session.user.id,
          status: "Active",
        },
      })
    }

    const messages = await prisma.message.findMany({
      where: {
        threadId: thread.id,
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
        timestamp: "desc",
      },
      take: limit + 1,
    })

    const hasMore = messages.length > limit
    const data = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? data[data.length - 1].timestamp.toISOString() : null

    return NextResponse.json({
      messages: data.reverse(),
      nextCursor,
      hasMore,
      threadId: thread.id,
    })
  } catch (error) {
    console.error("[v0] Error fetching channel messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await params
    const body = await request.json()
    const { content, messageType, metadata, replyToId, mentions, attachments } = body

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

    let thread = await prisma.thread.findFirst({
      where: {
        channelId,
        title: `${channel.name} General`,
      },
    })

    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          channelId,
          title: `${channel.name} General`,
          creatorId: session.user.id,
          status: "Active",
        },
      })
    }

    const detectedMentions = mentions || extractMentions(content)
    const users = await prisma.user.findMany()
    const mentionedUserIds = extractUserIds(detectedMentions, users)

    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        userId: session.user.id,
        content,
        messageType: messageType || "standard",
        metadata,
        replyToId,
        depth: replyToId ? 1 : 0,
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
          thread.id,
          content
        )
      }
    }

    const ably = getAblyRest()
    const ablyChannel = ably.channels.get(AblyChannels.channel(channelId))
    await ablyChannel.publish(AblyEvents.MESSAGE_SENT, message)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("[v0] Channel message creation error:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
