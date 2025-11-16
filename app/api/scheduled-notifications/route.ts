import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  createScheduledNotification,
  getUserScheduledNotifications,
  getNotificationStats,
} from "@/lib/scheduled-notifications"
import { z } from "zod"

const createSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  scheduleType: z.enum(["once", "daily", "weekly", "monthly", "custom"]),
  scheduledFor: z.string(),
  timezone: z.string().optional(),
  recurrence: z
    .object({
      frequency: z.number().optional(),
      daysOfWeek: z.array(z.number()).optional(),
      daysOfMonth: z.array(z.number()).optional(),
      endDate: z.string().optional(),
    })
    .optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  linkUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const stats = searchParams.get("stats") === "true"

    if (stats) {
      const notificationStats = await getNotificationStats(session.user.id)
      return NextResponse.json(notificationStats)
    }

    const notifications = await getUserScheduledNotifications(session.user.id)
    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error("[API] Error fetching scheduled notifications:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = createSchema.parse(body)

    const notification = await createScheduledNotification({
      userId: session.user.id,
      ...data,
      scheduledFor: new Date(data.scheduledFor),
      recurrence: data.recurrence
        ? {
            ...data.recurrence,
            endDate: data.recurrence.endDate ? new Date(data.recurrence.endDate) : undefined,
          }
        : undefined,
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error: any) {
    console.error("[API] Error creating scheduled notification:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
