import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { emojiId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { emojiId } = await params
    const body = await request.json()

    const emoji = await prisma.customEmoji.update({
      where: { id: emojiId },
      data: body,
    })

    return NextResponse.json(emoji)
  } catch (error) {
    console.error("[v0] Update custom emoji error:", error)
    return NextResponse.json({ error: "Failed to update custom emoji" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { emojiId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { emojiId } = await params

    await prisma.customEmoji.update({
      where: { id: emojiId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete custom emoji error:", error)
    return NextResponse.json({ error: "Failed to delete custom emoji" }, { status: 500 })
  }
}
