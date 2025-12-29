import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Check membership
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [logs, total] = await Promise.all([
      prisma.workspaceAuditLog.findMany({
        where: { workspaceId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          workspace: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.workspaceAuditLog.count({
        where: { workspaceId },
      }),
    ])

    // Fetch user details for logs
    const userIds = [...new Set(logs.map((log) => log.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    const userMap = users.reduce(
      (acc, user) => {
        acc[user.id] = user
        return acc
      },
      {} as Record<string, (typeof users)[0]>,
    )

    const enrichedLogs = logs.map((log) => ({
      ...log,
      user: userMap[log.userId] || null,
    }))

    return NextResponse.json({
      logs: enrichedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
