import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import crypto from "crypto"
import { z } from "zod"

const createIncomingWebhookSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await params
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId: channelId,
        userId: session.user.id,
        role: { in: ["admin", "owner"] },
      },
    })

    if (!channelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const webhooks = await prisma.channelIncomingWebhook.findMany({
      where: { channelId: channelId },
      include: {
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(webhooks)
  } catch (error) {
    console.error("Failed to fetch incoming webhooks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await params

    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId: channelId,
        userId: session.user.id,
        role: { in: ["admin", "owner"] },
      },
    })

    if (!channelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createIncomingWebhookSchema.parse(body)

    const token = crypto.randomBytes(32).toString("hex")
    const secret = crypto.randomBytes(32).toString("hex")

    const webhook = await prisma.channelIncomingWebhook.create({
      data: {
        channelId: channelId,
        name: validatedData.name,
        description: validatedData.description,
        token,
        secret,
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
    console.error("Failed to create incoming webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
