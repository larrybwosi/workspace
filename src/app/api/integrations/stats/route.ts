import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get API key stats
    const [activeKeys, totalKeys] = await Promise.all([
      prisma.apiKey.count({
        where: { userId, isActive: true },
      }),
      prisma.apiKey.count({
        where: { userId },
      }),
    ])

    // Get webhook stats
    const [activeWebhooks, totalWebhooks] = await Promise.all([
      prisma.webhook.count({
        where: { userId, isActive: true },
      }),
      prisma.webhook.count({
        where: { userId },
      }),
    ])

    // Get webhook success rate from last 100 logs
    const recentLogs = await prisma.webhookLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      where: {
        webhook: { userId },
      },
    })

    const successRate = recentLogs.length > 0
      ? Math.round((recentLogs.filter(log => log.success).length / recentLogs.length) * 100)
      : 0

    return NextResponse.json({
      activeKeys,
      totalKeys,
      activeWebhooks,
      totalWebhooks,
      apiCalls24h: 0, // TODO: Implement API call tracking
      rateLimitUsage: 0, // TODO: Implement rate limit tracking
      webhookSuccessRate: successRate,
    })
  } catch (error) {
    console.error("Error fetching integration stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
