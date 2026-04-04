import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import {
  updateScheduledNotification,
  deleteScheduledNotification,
  pauseScheduledNotification,
  resumeScheduledNotification
} from "@/lib/notifications/scheduled-notifications"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...updates } = body

    let result
    if (action === "pause") {
      result = await pauseScheduledNotification(id)
    } else if (action === "resume") {
      result = await resumeScheduledNotification(id)
    } else {
      result = await updateScheduledNotification(id, updates)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(" Scheduled notification patch error:", error)
    return NextResponse.json({ error: "Failed to update scheduled notification" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await deleteScheduledNotification(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(" Scheduled notification delete error:", error)
    return NextResponse.json({ error: "Failed to delete scheduled notification" }, { status: 500 })
  }
}
