import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import crypto from "crypto"

const createWebhookSchema = z.object({
  name: z.string().min(1, "Webhook name is required"),
  url: z.string().url("Invalid webhook URL"),
  events: z
    .array(
      z.enum([
        "message.created",
        "message.updated",
        "message.deleted",
        "message.pinned",
        "message.unpinned",
        "member.added",
        "member.removed",
        "member.role_updated",
      ]),
    )
    .min(1, "At least one event must be selected"),
})

export async function GET(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to the channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId: params.channelId,
        userId: session.user.id,
      },
    })

    if (!channelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const webhooks = await prisma.channelWebhook.findMany({
      where: { channelId: params.channelId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            logs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(webhooks)
  } catch (error) {
    console.error("Failed to fetch channel webhooks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or owner of the channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId: params.channelId,
        userId: session.user.id,
        role: {
          in: ["admin", "owner"],
        },
      },
    })

    if (!channelMember) {
      return NextResponse.json({ error: "Only channel admins can create webhooks" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createWebhookSchema.parse(body)

    // Generate secure secret for webhook signature verification
    const secret = crypto.randomBytes(32).toString("hex")

    const webhook = await prisma.channelWebhook.create({
      data: {
        channelId: params.channelId,
        name: validatedData.name,
        url: validatedData.url,
        secret,
        events: validatedData.events,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Failed to create channel webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
