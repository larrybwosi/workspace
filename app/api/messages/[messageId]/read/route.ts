import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await params

    // Mark message as read (upsert to avoid duplicates)
    // const messageRead = await prisma.messageRead.upsert({
    //   where: {
    //     messageId_userId: {
    //       messageId,
    //       userId: session.user.id,
    //     },
    //   },
    //   update: {
    //     readAt: new Date(),
    //   },
    //   create: {
    //     messageId,
    //     userId: session.user.id,
    //   },
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Mark as read error:", error)
    return NextResponse.json({ error: "Failed to mark message as read" }, { status: 500 })
  }
}
