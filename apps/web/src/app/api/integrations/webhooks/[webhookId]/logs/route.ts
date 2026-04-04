import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(
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

    // Verify webhook ownership
    const webhook = await prisma.webhook.findUnique({
      where: {
        id: webhookId,
        userId: session.user.id,
      },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const logs = await prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching webhook logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch webhook logs" },
      { status: 500 }
    )
  }
}
