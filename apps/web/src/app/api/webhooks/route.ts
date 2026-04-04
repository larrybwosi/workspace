import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV1, hasPermission, isRateLimitExceeded } from "@/lib/auth/api-auth"
import { z } from "zod"
import crypto from "crypto"

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  workspaceId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const context = await authenticateV1(request as any)
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const webhooks = await prisma.webhook.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(webhooks)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await authenticateV1(request as any)
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!hasPermission(context, "webhooks:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, url, events } = createWebhookSchema.parse(body)

    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events: events as any,
        secret,
        userId: context.userId,
        isActive: true,
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
