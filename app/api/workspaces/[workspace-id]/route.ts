import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  settings: z.record(z.any()).optional(),
  plan: z.enum(["free", "pro", "enterprise"]).optional(),
})

export async function GET(request: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.workspaceId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
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
        },
        projects: {
          select: {
            id: true,
            name: true,
            icon: true,
            status: true,
          },
        },
        channels: {
          select: {
            id: true,
            name: true,
            icon: true,
            type: true,
          },
        },
        _count: {
          select: {
            projects: true,
            channels: true,
            notes: true,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check if user is a member
    const isMember = workspace.members.some((m) => m.userId === session.user.id)
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error("[v0] Failed to fetch workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or owner
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateWorkspaceSchema.parse(body)

    const workspace = await prisma.workspace.update({
      where: { id: params.workspaceId },
      data: validatedData,
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: session.user.id,
        action: "workspace.updated",
        resource: "workspace",
        resourceId: params.workspaceId,
        metadata: validatedData,
      },
    })

    return NextResponse.json(workspace)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[v0] Failed to update workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.workspaceId },
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Only owner can delete workspace
    if (workspace.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.workspace.delete({
      where: { id: params.workspaceId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
