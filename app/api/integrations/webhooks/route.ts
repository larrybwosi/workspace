import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { z } from "zod"

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
})

/**
 * GET /api/integrations/webhooks
 * List all webhooks for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const webhooks = await prisma.webhook.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(webhooks)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
  }
}

/**
 * POST /api/integrations/webhooks
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createWebhookSchema.parse(body)

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString("hex")

    const webhook = await prisma.webhook.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        events: validatedData.events,
        secret,
        userId: session.user.id,
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}
