import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; tokenId: string }> },
) {
  try {
    const { workspaceId, tokenId } = await params
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

    await prisma.workspaceApiToken.delete({
      where: { id: tokenId },
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "api_token.deleted",
        resource: "api_token",
        resourceId: tokenId,
        metadata: {},
      },
    })

    return NextResponse.json({ message: "API token deleted successfully" })
  } catch (error) {
    console.error("Failed to delete API token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
