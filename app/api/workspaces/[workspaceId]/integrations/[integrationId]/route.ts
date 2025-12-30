import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateIntegrationSchema = z.object({
  config: z.record(z.any()).optional(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; integrationId: string }> },
) {
  try {
    const { workspaceId, integrationId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const integration = await prisma.workspaceIntegration.findFirst({
      where: {
        id: integrationId,
        workspaceId,
      },
    })

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    return NextResponse.json(integration)
  } catch (error) {
    console.error("Failed to fetch integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; integrationId: string }> },
) {
  try {
    const { workspaceId, integrationId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateIntegrationSchema.parse(body)

    const integration = await prisma.workspaceIntegration.update({
      where: { id: integrationId },
      data: {
        ...(validatedData.config && { config: validatedData.config }),
        ...(typeof validatedData.active === "boolean" && { active: validatedData.active }),
      },
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "integration.updated",
        resource: "integration",
        resourceId: integrationId,
        metadata: validatedData,
      },
    })

    return NextResponse.json(integration)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Failed to update integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; integrationId: string }> },
) {
  try {
    const { workspaceId, integrationId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.workspaceIntegration.delete({
      where: { id: integrationId },
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "integration.deleted",
        resource: "integration",
        resourceId: integrationId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
