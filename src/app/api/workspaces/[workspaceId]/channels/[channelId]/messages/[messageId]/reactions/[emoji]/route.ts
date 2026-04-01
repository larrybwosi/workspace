import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string; emoji: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId, emoji } = await params

    const reaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      },
    })

    if (!reaction) {
      return NextResponse.json({ error: "Reaction not found" }, { status: 404 })
    }

    await prisma.reaction.delete({
      where: { id: reaction.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Delete workspace reaction error:", error)
    return NextResponse.json({ error: "Failed to delete reaction" }, { status: 500 })
  }
}
