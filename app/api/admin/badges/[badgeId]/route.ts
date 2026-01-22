import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ badgeId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { badgeId } = await params
    const body = await request.json()

    const badge = await prisma.userBadge.update({
      where: { id: badgeId },
      data: body,
    })

    return NextResponse.json(badge)
  } catch (error) {
    console.error("Update badge error:", error)
    return NextResponse.json({ error: "Failed to update badge" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ badgeId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { badgeId } = await params

    await prisma.userBadge.update({
      where: { id: badgeId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete badge error:", error)
    return NextResponse.json({ error: "Failed to delete badge" }, { status: 500 })
  }
}
