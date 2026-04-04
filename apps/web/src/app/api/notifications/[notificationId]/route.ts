import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ notificationId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId } = await params
    const body = await request.json()
    const { isRead } = body

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        isRead: isRead !== undefined ? isRead : true,
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error(" Notification update error:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ notificationId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId } = await params

    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(" Notification delete error:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}
