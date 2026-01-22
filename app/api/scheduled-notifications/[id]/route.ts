import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import {
  updateScheduledNotification,
  deleteScheduledNotification,
  pauseScheduledNotification,
  resumeScheduledNotification,
} from "@/lib/notifications/scheduled-notifications"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notification = await prisma.scheduledNotification.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        history: {
          orderBy: { sentAt: "desc" },
          take: 10,
        },
      },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json(notification)
  } catch (error: any) {
    console.error("[API] Error fetching scheduled notification:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const existing = await prisma.scheduledNotification.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    const body = await req.json()
    const { action, ...updates } = body

    let notification

    if (action === "pause") {
      notification = await pauseScheduledNotification(params.id)
    } else if (action === "resume") {
      notification = await resumeScheduledNotification(params.id)
    } else {
      notification = await updateScheduledNotification(params.id, {
        ...updates,
        scheduledFor: updates.scheduledFor ? new Date(updates.scheduledFor) : undefined,
      })
    }

    return NextResponse.json(notification)
  } catch (error: any) {
    console.error("[API] Error updating scheduled notification:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const existing = await prisma.scheduledNotification.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    await deleteScheduledNotification(params.id)

    return NextResponse.json({ message: "Notification deleted successfully" })
  } catch (error: any) {
    console.error("[API] Error deleting scheduled notification:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
