import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import crypto from "crypto"

const createTokenSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.object({
    departments: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
    actions: z.array(
      z.enum([
        "read:members",
        "write:members",
        "read:departments",
        "write:departments",
        "read:teams",
        "write:teams",
        "read:announcements",
        "write:announcements",
        "read:channels",
        "write:channels",
        "send:messages",
      ]),
    ),
  }),
  rateLimit: z.number().min(100).max(100000).optional().default(1000),
  expiresAt: z.string().datetime().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
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

    const tokens = await prisma.workspaceApiToken.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        token: true,
        permissions: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        usageCount: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Mask tokens (show only last 8 chars)
    const maskedTokens = tokens.map((t) => ({
      ...t,
      token: `wst_${"*".repeat(24)}${t.token.slice(-8)}`,
    }))

    return NextResponse.json({ tokens: maskedTokens })
  } catch (error) {
    console.error("[v0] Failed to fetch API tokens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
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
    const data = createTokenSchema.parse(body)

    // Generate secure token
    const token = `wst_${crypto.randomBytes(32).toString("hex")}`

    const apiToken = await prisma.workspaceApiToken.create({
      data: {
        workspaceId,
        name: data.name,
        token,
        permissions: data.permissions,
        rateLimit: data.rateLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdById: session.user.id,
      },
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "api_token.created",
        resource: "api_token",
        resourceId: apiToken.id,
        metadata: { name: data.name, permissions: data.permissions.actions },
      },
    })

    // Return the full token only on creation
    return NextResponse.json(
      {
        ...apiToken,
        token, // Full token shown only once
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[v0] Failed to create API token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
