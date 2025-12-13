import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a member
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"
    const now = new Date()
    const startDate = new Date(now.getTime() - (range === "7d" ? 7 : range === "30d" ? 30 : 90) * 24 * 60 * 60 * 1000)

    // Fetch comprehensive analytics
    const [totalProjects, totalTasks, totalMembers, activeProjects, recentActivity, taskStats] = await Promise.all([
      prisma.project.count({
        where: { workspaceId: params.workspaceId },
      }),
      prisma.task.count({
        where: {
          project: { workspaceId: params.workspaceId },
        },
      }),
      prisma.workspaceMember.count({
        where: { workspaceId: params.workspaceId },
      }),
      prisma.project.count({
        where: {
          workspaceId: params.workspaceId,
          status: "active",
        },
      }),
      prisma.workspaceAuditLog.count({
        where: {
          workspaceId: params.workspaceId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: {
          project: { workspaceId: params.workspaceId },
        },
        _count: true,
      }),
    ])

    // Calculate task completion rate
    const completedTasks = taskStats.find((s) => s.status === "done")?._count || 0
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Get growth metrics
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const previousActivity = await prisma.workspaceAuditLog.count({
      where: {
        workspaceId: params.workspaceId,
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    })

    const activityGrowth =
      previousActivity > 0 ? Math.round(((recentActivity - previousActivity) / previousActivity) * 100) : 0

    return NextResponse.json({
      overview: {
        totalProjects,
        totalTasks,
        totalMembers,
        activeProjects,
        completionRate,
        activityGrowth,
      },
      taskStats,
      recentActivity,
      timeRange: range,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
