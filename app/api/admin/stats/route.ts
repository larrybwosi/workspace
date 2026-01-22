import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const [
      totalUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      totalMessages,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: "done" } }),
      prisma.message.count(),
    ])

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const activeUsers = await prisma.session.groupBy({
      by: ["userId"],
      where: {
        expiresAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    return NextResponse.json({
      totalUsers,
      activeUsers: activeUsers.length,
      totalProjects,
      totalTasks,
      completedTasks,
      totalMessages,
      storageUsed: 45.2,
      storageTotal: 100,
      userGrowth: 12.5,
      activityGrowth: 8.3,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
