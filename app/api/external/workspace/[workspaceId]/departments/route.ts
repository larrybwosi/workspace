import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/ably"

const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  managerId: z.string().optional(),
})

async function validateApiToken(request: NextRequest, workspaceId: string) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice(7)
  const apiToken = await prisma.workspaceApiToken.findUnique({
    where: { token },
  })

  if (!apiToken || apiToken.workspaceId !== workspaceId) {
    return null
  }

  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return null
  }

  await prisma.workspaceApiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
  })

  return apiToken
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const apiToken = await validateApiToken(request, workspaceId)

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid or expired API token" }, { status: 401 })
    }

    const permissions = apiToken.permissions as any
    if (!permissions?.actions?.includes("read:departments")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const departments = await prisma.workspaceDepartment.findMany({
      where: { workspaceId },
      include: {
        manager: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { members: true, channels: true } },
      },
    })

    return NextResponse.json({ departments })
  } catch (error) {
    console.error("[v0] External API - Failed to fetch departments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const apiToken = await validateApiToken(request, workspaceId)

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid or expired API token" }, { status: 401 })
    }

    const permissions = apiToken.permissions as any
    if (!permissions?.actions?.includes("write:departments")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const data = createDepartmentSchema.parse(body)

    const department = await prisma.workspaceDepartment.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
        managerId: data.managerId,
      },
    })

    const ably = getAblyServer()
    const ablyChannel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await ablyChannel.publish(EVENTS.DEPARTMENT_CREATED, { department })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: apiToken.createdById,
        action: "department.created_via_api",
        resource: "department",
        resourceId: department.id,
        metadata: { departmentName: data.name, tokenName: apiToken.name },
      },
    })

    return NextResponse.json({ success: true, department }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[v0] External API - Failed to create department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
