import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import {
  createScheduledNotification,
  getUserScheduledNotifications,
  getNotificationStats
} from "@/lib/notifications/scheduled-notifications"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stats = searchParams.get("stats") === "true"

    if (stats) {
      const data = await getNotificationStats(session.user.id)
      return NextResponse.json(data)
    }

    const notifications = await getUserScheduledNotifications(session.user.id)
    return NextResponse.json(notifications)
  } catch (error) {
    console.error(" Scheduled notifications fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch scheduled notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, scheduleType, scheduledFor, recurrence, entityType, entityId, linkUrl, metadata } = body

    if (!title || !message || !scheduleType || !scheduledFor) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const notification = await createScheduledNotification({
      userId: session.user.id,
      title,
      message,
      scheduleType,
      scheduledFor: new Date(scheduledFor),
      recurrence,
      entityType,
      entityId,
      linkUrl,
      metadata,
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error(" Scheduled notification creation error:", error)
    return NextResponse.json({ error: "Failed to create scheduled notification" }, { status: 500 })
  }
}
