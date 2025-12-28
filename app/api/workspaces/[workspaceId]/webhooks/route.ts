import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import crypto from "crypto"

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params;

    const webhooks = await prisma.workspaceWebhook.findMany({
      where: { workspaceId: workspaceId },
      include: {
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
    console.error("[v0] Failed to fetch webhooks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params;
    const body = await request.json()
    const validatedData = createWebhookSchema.parse(body)

    const secret = crypto.randomBytes(32).toString("hex")

    const webhook = await prisma.workspaceWebhook.create({
      data: {
        workspaceId: workspaceId,
        name: validatedData.name,
        url: validatedData.url,
        secret,
        events: validatedData.events,
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[v0] Failed to create webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
