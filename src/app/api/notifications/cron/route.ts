import { type NextRequest, NextResponse } from "next/server"
import { processScheduledNotifications, processScheduledCalls } from "@/lib/notifications/scheduled-notifications"

// This endpoint should be called by a cron job (e.g. GitHub Actions, Vercel Cron, etc.)
// For security, you should add a secret token check here.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Processing notifications and calls...')
    await processScheduledNotifications()
    await processScheduledCalls()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
