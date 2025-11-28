import { type NextRequest, NextResponse } from "next/server"
import { authenticateApiKey, hasPermission } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/external/channels
 * List all channels accessible by the API key owner
 */
export async function GET(request: NextRequest) {
  try {
    const apiContext = await authenticateApiKey(request)
    if (!apiContext) {
      return NextResponse.json({ error: "Unauthorized", code: "INVALID_API_KEY" }, { status: 401 })
    }

    if (!hasPermission(apiContext, "channels:read")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { isPrivate: false },
          {
            members: {
              some: { userId: apiContext.userId },
            },
          },
        ],
        ...(workspaceId ? { workspaceId } : {}),
      },
      select: {
        id: true,
        name: true,
        icon: true,
        type: true,
        description: true,
        isPrivate: true,
        workspaceId: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      channels: channels.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        type: c.type,
        description: c.description,
        isPrivate: c.isPrivate,
        workspaceId: c.workspaceId,
        memberCount: c._count.members,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[External API] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
