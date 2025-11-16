import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            projects: true,
            createdTasks: true,
          },
        },
        sessions: {
          orderBy: {
            expiresAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const members = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "Member",
      status: user.status,
      avatar: user.avatar || user.name.substring(0, 2).toUpperCase(),
      joinedAt: user.createdAt,
      lastActive: user.sessions[0]?.expiresAt || user.updatedAt,
      projectsCount: user._count.projects,
      tasksCompleted: user._count.createdTasks,
      invitedBy: "System", // Can be enhanced with actual invitation tracking
    }))

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching admin members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}
