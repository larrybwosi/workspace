import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope, logV2Audit } from "@/lib/auth/api-v2-auth"
import { redis } from "@/lib/redis"
import { dispatchWebhook } from "@/lib/webhooks"
import { z } from "zod"

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional().default("Hash"),
  type: z.enum(["public", "private"]).optional().default("public"),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { context, error } = await authenticateV2(request as any, { slug })
  if (error) return error

  if (!hasScope(context!, "channels:read")) {
    return NextResponse.json({ error: "Forbidden: Missing channels:read scope" }, { status: 403 })
  }

  // Redis Caching
  const cacheKey = `v2:channels:${context!.workspaceId}`
  const cachedChannels = await redis.get(cacheKey)

  if (cachedChannels) {
    return NextResponse.json({ channels: JSON.parse(cachedChannels), source: "cache" })
  }

  const channels = await prisma.channel.findMany({
    where: {
      workspaceId: context!.workspaceId,
      workspace: { slug },
    },
    include: {
      _count: {
        select: { members: true, messages: true }
      }
    }
  })

  // Cache for 10 minutes
  await redis.setex(cacheKey, 600, JSON.stringify(channels))

  await logV2Audit(context!, "channels.list", "channel")

  return NextResponse.json({ channels, source: "database" })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { context, error } = await authenticateV2(request as any, { slug })
  if (error) return error

  if (!hasScope(context!, "channels:write")) {
    return NextResponse.json({ error: "Forbidden: Missing channels:write scope" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, icon, type, description, metadata } = createChannelSchema.parse(body)

    const channel = await prisma.channel.create({
      data: {
        name,
        icon,
        type: type === "private" ? "private" : "channel",
        isPrivate: type === "private",
        description,
        metadata: (metadata as any) || {},
        workspaceId: context!.workspaceId!,
        createdById: context!.userId,
      },
    })

    // Invalidate cache
    await redis.del(`v2:channels:${context!.workspaceId}`)

    await logV2Audit(context!, "channels.create", "channel", channel.id, { name: channel.name })

    await dispatchWebhook(context!.workspaceId!, "channel.created", { channel })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
