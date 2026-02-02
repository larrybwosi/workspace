import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateSchema = z.object({
  active: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; webhookId: string }> },
) {
  try {
    const { workspaceId, webhookId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const webhook = await prisma.workspaceWebhook.update({
      where: { id: webhookId },
      data,
    })

    return NextResponse.json(webhook)
  } catch (error) {
    console.error("Failed to update webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; webhookId: string }> },
) {
  try {
    const { workspaceId, webhookId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.workspaceWebhook.delete({
      where: { id: webhookId },
    })

    return NextResponse.json({ message: "Webhook deleted successfully" })
  } catch (error) {
    console.error("Failed to delete webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
