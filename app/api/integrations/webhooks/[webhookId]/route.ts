import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { webhookId } = await params
    const body = await request.json()

    const webhook = await prisma.webhook.update({
      where: {
        id: webhookId,
        userId: session.user.id,
      },
      data: body,
    })

    return NextResponse.json(webhook)
  } catch (error) {
    console.error("Error updating webhook:", error)
    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { webhookId } = await params

    await prisma.webhook.delete({
      where: {
        id: webhookId,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting webhook:", error)
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    )
  }
}
