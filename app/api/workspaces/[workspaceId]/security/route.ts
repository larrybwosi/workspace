import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const securitySchema = z.object({
  requireMfa: z.boolean().optional(),
  allowGuestAccess: z.boolean().optional(),
  sessionTimeout: z.string().optional(),
  ipWhitelist: z.string().optional(),
  domainRestriction: z.string().optional(),
  ssoEnabled: z.boolean().optional(),
  passwordMinLength: z.string().optional(),
  passwordRequireSpecialChar: z.boolean().optional(),
  passwordExpiry: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { securitySettings: true },
    })

    return NextResponse.json(
      workspace?.securitySettings || {
        requireMfa: false,
        allowGuestAccess: true,
        sessionTimeout: "24",
        ipWhitelist: "",
        domainRestriction: "",
        ssoEnabled: false,
        passwordMinLength: "8",
        passwordRequireSpecialChar: true,
        passwordExpiry: "90",
      },
    )
  } catch (error) {
    console.error("Failed to fetch security settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
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
    const data = securitySchema.parse(body)

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { securitySettings: data },
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "security.updated",
        resource: "workspace",
        resourceId: workspaceId,
        metadata: data,
      },
    })

    return NextResponse.json(workspace.securitySettings)
  } catch (error) {
    console.error("Failed to update security settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
