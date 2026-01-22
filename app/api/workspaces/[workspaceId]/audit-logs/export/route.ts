import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin/owner role
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const logs = await prisma.workspaceAuditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 10000, // Limit export to 10k records
    })

    // Fetch user details
    const userIds = [...new Set(logs.map((log) => log.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    })

    const userMap = users.reduce(
      (acc, user) => {
        acc[user.id] = user
        return acc
      },
      {} as Record<string, (typeof users)[0]>,
    )

    // Generate CSV
    const csvHeader = "Timestamp,Action,Actor Name,Actor Email,Resource,Resource ID,Metadata\n"
    const csvRows = logs
      .map((log) => {
        const user = userMap[log.userId]
        return [
          new Date(log.createdAt).toISOString(),
          log.action,
          user?.name || "Unknown",
          user?.email || "N/A",
          log.resource,
          log.resourceId || "N/A",
          JSON.stringify(log.metadata || {}),
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      })
      .join("\n")

    const csv = csvHeader + csvRows

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${workspaceId}-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error("Failed to export audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
