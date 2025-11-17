import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendPushNotification } from "@/lib/push-notifications"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, body: message, data, linkUrl } = body

    const results = await sendPushNotification({
      userId: session.user.id,
      title: title || "Test Notification",
      body: message || "This is a test notification",
      data,
      linkUrl,
    })

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error(" Test push notification error:", error)
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 })
  }
}
