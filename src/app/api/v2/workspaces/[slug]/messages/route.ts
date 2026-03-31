import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope } from "@/lib/auth/api-v2-auth"
import { z } from "zod"

const sendMessageSchema = z.object({
  channelId: z.string().optional(),
  recipientId: z.string().optional(),
  content: z.string().min(1),
  threadId: z.string().optional(),
  contextId: z.string().optional(),
  messageType: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string(),
    size: z.string().optional(),
  })).optional(),
}).refine(data => data.channelId || data.recipientId, {
  message: "Either channelId or recipientId must be provided"
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  const { slug } = await params
  const { context, error } = await authenticateV2(request, { slug })
  if (error) return error

  if (!hasScope(context!, "messages:read")) {
    return NextResponse.json({ error: "Forbidden: Missing messages:read scope" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get("channelId")
  const threadId = searchParams.get("threadId")
  const contextId = searchParams.get("contextId")
  const limit = parseInt(searchParams.get("limit") || "50")
  const cursor = searchParams.get("cursor")

  try {
    let activeThreadId = threadId

    if (contextId && !activeThreadId && channelId) {
      const thread = await prisma.thread.findFirst({
        where: {
          channelId,
          tags: { some: { tag: contextId } }
        }
      })

      if (!thread) {
        // If contextId is provided but no thread exists, return empty list
        return NextResponse.json({ messages: [], nextCursor: null })
      }
      activeThreadId = thread.id
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId: channelId || undefined,
        threadId: activeThreadId || null, // null for root messages if no threadId and no contextId
        channel: { workspaceId: context!.workspaceId }
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { timestamp: "desc" },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        attachments: true,
        reactions: true,
        actions: true,
      }
    })

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

    return NextResponse.json({ messages: messages.reverse(), nextCursor })
  } catch (err) {
    console.error("V2 Get Messages Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  const { slug } = await params
  const { context, error } = await authenticateV2(request, { slug })
  if (error) return error

  if (!hasScope(context!, "messages:send")) {
    return NextResponse.json({ error: "Forbidden: Missing messages:send scope" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      channelId,
      recipientId,
      content,
      threadId,
      contextId,
      messageType,
      metadata,
      attachments
    } = sendMessageSchema.parse(body)

    let createdMessage
    let activeThreadId = threadId

    if (channelId) {
      // 1. Send message to a channel
      const channel = await prisma.channel.findFirst({
        where: { id: channelId, workspaceId: context!.workspaceId }
      })

      if (!channel) return NextResponse.json({ error: "Channel not found in this workspace" }, { status: 404 })

      // Handle context-aware threading
      if (contextId && !activeThreadId) {
        const existingThread = await prisma.thread.findFirst({
          where: {
            channelId: channel.id,
            tags: { some: { tag: contextId } }
          }
        })

        if (existingThread) {
          activeThreadId = existingThread.id
        } else {
          const newThread = await prisma.thread.create({
            data: {
              channelId: channel.id,
              creatorId: context!.userId,
              tags: { create: { tag: contextId } }
            }
          })
          activeThreadId = newThread.id
        }
      }

      createdMessage = await prisma.message.create({
        data: {
          content,
          channelId: channel.id,
          userId: context!.userId,
          threadId: activeThreadId,
          messageType: messageType || "standard",
          metadata: (metadata as any) || {},
          attachments: attachments ? {
            create: attachments.map(a => ({
              name: a.name,
              type: a.type,
              url: a.url,
              size: a.size
            }))
          } : undefined
        },
        include: {
          attachments: true,
          user: { select: { id: true, name: true, avatar: true } }
        }
      })
    } else if (recipientId) {
      // 2. Send message directly to a workspace member (via DM)
      // Check if recipient is a member of the same workspace
      const recipientMembership = await prisma.workspaceMember.findFirst({
        where: { userId: recipientId, workspaceId: context!.workspaceId }
      })

      if (!recipientMembership) {
        return NextResponse.json({ error: "Recipient is not a member of this workspace" }, { status: 403 })
      }

      // Find or create direct message (DM) conversation
      const participants = [context!.userId, recipientId].sort()
      let dm = await prisma.directMessage.findUnique({
        where: {
          participant1Id_participant2Id: {
            participant1Id: participants[0],
            participant2Id: participants[1]
          }
        }
      })

      if (!dm) {
        dm = await prisma.directMessage.create({
          data: {
            participant1Id: participants[0],
            participant2Id: participants[1]
          }
        })
      }

      createdMessage = await prisma.dMMessage.create({
        data: {
          content,
          dmId: dm.id,
          senderId: context!.userId,
          attachments: attachments ? {
            create: attachments.map(a => ({
              name: a.name,
              type: a.type,
              url: a.url,
              size: a.size
            }))
          } : undefined
        },
        include: {
          attachments: true,
          sender: { select: { id: true, name: true, avatar: true } }
        }
      })

      await prisma.directMessage.update({
        where: { id: dm.id },
        data: { lastMessageAt: new Date() }
      })
    }

    return NextResponse.json({ message: createdMessage }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("V2 Send Message Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
