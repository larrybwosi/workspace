import { type NextRequest, NextResponse } from "next/server"
import { runAllCronTasks } from "@/lib/utils/cron-tasks"

/**
 * GET /api/cron/tasks
 *
 * Run all scheduled cron tasks for task and project management
 * Should be triggered by an external cron service (e.g., Vercel Cron, AWS Lambda, etc.)
 *
 * Authorization: Bearer token via CRON_SECRET env variable
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET not configured")
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 })
  }

  // Verify the cron secret from the Authorization header
  const authHeader = request.headers.get("authorization")
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await runAllCronTasks()
    return NextResponse.json({ success: true, message: "Cron tasks executed successfully" })
  } catch (error) {
    console.error("[Cron] Error:", error)
    return NextResponse.json({ error: "Failed to execute cron tasks" }, { status: 500 })
  }
}
