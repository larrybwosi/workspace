import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  settings: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; departmentId: string }> },
) {
  try {
    const { workspaceId, departmentId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const department = await prisma.workspaceDepartment.findUnique({
      where: { id: departmentId },
      include: {
        parent: true,
        children: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, status: true } },
          },
        },
        teams: {
          include: {
            members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
            _count: { select: { members: true } },
          },
        },
        announcements: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { members: true, teams: true, announcements: true } },
      },
    })

    if (!department || department.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error("Failed to fetch department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; departmentId: string }> },
) {
  try {
    const { workspaceId, departmentId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = updateDepartmentSchema.parse(body)

    const department = await prisma.workspaceDepartment.update({
      where: { id: departmentId },
      data,
      include: { parent: true, members: { include: { user: true } }, teams: true },
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "department.updated",
        resource: "department",
        resourceId: departmentId,
        metadata: data,
      },
    })

    return NextResponse.json(department)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Failed to update department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; departmentId: string }> },
) {
  try {
    const { workspaceId, departmentId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.workspaceDepartment.delete({ where: { id: departmentId } })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "department.deleted",
        resource: "department",
        resourceId: departmentId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
