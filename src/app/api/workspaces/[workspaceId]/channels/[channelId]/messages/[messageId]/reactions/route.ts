import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await params
    const body = await request.json()
    const { emoji } = body

    const reaction = await prisma.reaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      },
      update: {},
      create: {
        messageId,
        userId: session.user.id,
        emoji,
      },
    })

    return NextResponse.json(reaction)
  } catch (error) {
    console.error("Workspace reaction error:", error)
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 })
  }
}
