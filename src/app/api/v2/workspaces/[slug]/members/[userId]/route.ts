import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope } from "@/lib/auth/api-v2-auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  const { slug, userId } = await params
  const { context, error } = await authenticateV2(request, { slug })
  if (error) return error

  if (!hasScope(context!, "members:write")) {
    return NextResponse.json({ error: "Forbidden: Missing members:write scope" }, { status: 403 })
  }

  try {
    // Check if member exists in the workspace
    const member = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId: context!.workspaceId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found in this workspace" }, { status: 404 })
    }

    // Don't allow deleting the owner or yourself (optional)
    const workspace = await prisma.workspace.findUnique({
      where: { id: context!.workspaceId },
    })

    if (workspace?.ownerId === userId) {
      return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 400 })
    }

    await prisma.workspaceMember.delete({
      where: {
        id: member.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
