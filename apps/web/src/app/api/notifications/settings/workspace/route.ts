import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
      select: {
        notificationPreference: true,
      },
    })

    return NextResponse.json(member || { notificationPreference: "all" })
  } catch (error) {
    console.error("Failed to fetch workspace notification settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, preference } = body

    if (!workspaceId || !preference) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
      data: {
        notificationPreference: preference,
      },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Failed to update workspace notification settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
