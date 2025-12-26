import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: { channelId: string; webhookId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId: params.channelId,
        userId: session.user.id,
        role: { in: ["admin", "owner"] },
      },
    })

    if (!channelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.channelIncomingWebhook.delete({
      where: { id: params.webhookId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete incoming webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { channelId: string; webhookId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId: params.channelId,
        userId: session.user.id,
        role: { in: ["admin", "owner"] },
      },
    })

    if (!channelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    const webhook = await prisma.channelIncomingWebhook.update({
      where: { id: params.webhookId },
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(webhook)
  } catch (error) {
    console.error("[v0] Failed to update incoming webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
