import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const allocateResourceSchema = z.object({
  userId: z.string(),
  role: z.string(),
  allocation: z.number().min(0).max(100),
  startDate: z.string(),
  endDate: z.string().optional(),
  billableRate: z.number().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { workspaceId: string; projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allocations = await prisma.resourceAllocation.findMany({
      where: {
        projectId: params.projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    })

    // Calculate utilization metrics
    const currentDate = new Date()
    const activeAllocations = allocations.filter((a) => {
      const start = new Date(a.startDate)
      const end = a.endDate ? new Date(a.endDate) : new Date("2099-12-31")
      return currentDate >= start && currentDate <= end
    })

    const totalAllocation = activeAllocations.reduce((sum, a) => sum + a.allocation, 0)
    const averageAllocation = activeAllocations.length > 0 ? totalAllocation / activeAllocations.length : 0

    return NextResponse.json({
      allocations,
      metrics: {
        totalResources: allocations.length,
        activeResources: activeAllocations.length,
        averageAllocation: Math.round(averageAllocation),
        totalAllocation: Math.round(totalAllocation),
      },
    })
  } catch (error) {
    console.error("[RESOURCES_GET]", error)
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { workspaceId: string; projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify permissions
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: params.workspaceId,
        userId: session.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = allocateResourceSchema.parse(body)

    const allocation = await prisma.resourceAllocation.create({
      data: {
        ...validatedData,
        projectId: params.projectId,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        cost: validatedData.billableRate ? validatedData.billableRate * validatedData.allocation : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: session.user.id,
        action: "project.resource_allocated",
        details: {
          projectId: params.projectId,
          allocationId: allocation.id,
          userId: validatedData.userId,
          allocation: validatedData.allocation,
        },
      },
    })

    return NextResponse.json(allocation, { status: 201 })
  } catch (error) {
    console.error("[RESOURCES_POST]", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to allocate resource" }, { status: 500 })
  }
}
