import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV1, hasPermission } from "@/lib/auth/api-auth"
import { z } from "zod"

const updateSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  settings: z.record(z.any()).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const context = await authenticateV1(request)
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspaceId } = await params
    const targetWorkspaceId = workspaceId === "current" ? context.workspaceId : workspaceId

    if (!targetWorkspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 })
    }

    if (!hasPermission(context, "workspace:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = updateSettingsSchema.parse(body)

    const workspace = await prisma.workspace.update({
      where: { id: targetWorkspaceId },
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        settings: data.settings as any,
      },
    })

    return NextResponse.json(workspace)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
