import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { publishToAbly, AblyChannels } from "@/lib/ably"

const updateMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member", "guest"]),
})


export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params

    // Check if user is a member of the workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId:workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId:workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
            // lastActiveAt: true,
          },
        },
      },
      orderBy: {
        // createdAt: "asc",
      },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Failed to fetch workspace members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
