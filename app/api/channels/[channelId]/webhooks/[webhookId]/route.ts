import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { channelId: string; webhookId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or owner
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateWebhookSchema.parse(body)

    const webhook = await prisma.channelWebhook.update({
      where: { id: params.webhookId },
      data: validatedData,
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

    return NextResponse.json(webhook)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Failed to update webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { channelId: string; webhookId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or owner
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.channelWebhook.delete({
      where: { id: params.webhookId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
