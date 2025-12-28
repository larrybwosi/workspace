import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ workspaceId: string; webhookId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { webhookId } = await params

    const webhook = await prisma.workspaceWebhook.update({
      where: { id: webhookId },
      data: {
        name: body.name,
        url: body.url,
        events: body.events,
        active: body.active,
      },
    })

    return NextResponse.json(webhook)
  } catch (error) {
    console.error("Failed to update webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ workspaceId: string; webhookId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { webhookId } = await params

    await prisma.workspaceWebhook.delete({
      where: { id: webhookId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
