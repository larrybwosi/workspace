import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV1, hasPermission } from "@/lib/auth/api-auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const context = await authenticateV1(request)
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspaceId } = await params
    const targetWorkspaceId = workspaceId === "current" ? context.workspaceId : workspaceId

    if (!targetWorkspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 })
    }

    if (!hasPermission(context, "members:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: targetWorkspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({ members })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
