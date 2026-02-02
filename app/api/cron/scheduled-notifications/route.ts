import { NextRequest, NextResponse } from "next/server"
import { processScheduledNotifications } from "@/lib/notifications/scheduled-notifications"

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await processScheduledNotifications()

    return NextResponse.json({ message: "Scheduled notifications processed successfully" })
  } catch (error: any) {
    console.error("[Cron] Error processing scheduled notifications:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
