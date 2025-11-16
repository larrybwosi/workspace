import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/ably"
import { extractMentions, extractUserIds } from "@/lib/mention-utils"
import { notifyMention } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get("threadId")

    if (!threadId) {
      return NextResponse.json({ error: "Thread ID required" }, { status: 400 })
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      include: {
        user: true,
        reactions: true,
        attachments: true,
        mentions: true,
        replies: {
          include: {
            user: true,
            reactions: true,
          },
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { threadId, content, messageType, metadata, replyToId, mentions, attachments } = body

    const detectedMentions = mentions || extractMentions(content)
    
    const users = await prisma.user.findMany()
    const mentionedUserIds = extractUserIds(detectedMentions, users)

    const message = await prisma.message.create({
      data: {
        threadId,
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
          threadId,
          content
        )
      }
    }

    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.thread(threadId))
    await channel.publish(AblyEvents.MESSAGE_SENT, message)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("[v0] Message creation error:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
