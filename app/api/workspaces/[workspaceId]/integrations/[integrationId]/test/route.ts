import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; integrationId: string }> },
) {
  try {
    const { workspaceId, integrationId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const integration = await prisma.workspaceIntegration.findFirst({
      where: { id: integrationId, workspaceId },
    })

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    const config = integration.config as Record<string, any>

    // Test the integration based on service type
    let testResult = { success: false, message: "", latency: 0 }
    const startTime = Date.now()

    try {
      switch (integration.service) {
        case "slack":
          if (config.webhookUrl) {
            const response = await fetch(config.webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: "Test message from Workspace - Integration is working!",
                attachments: [
                  {
                    color: "#36a64f",
                    title: "Integration Test",
                    text: "This is a test message to verify your Slack integration.",
                    footer: "Workspace Integration",
                    ts: Math.floor(Date.now() / 1000),
                  },
                ],
              }),
            })
            testResult = {
              success: response.ok,
              message: response.ok ? "Slack webhook is working" : "Slack webhook failed",
              latency: Date.now() - startTime,
            }
          }
          break

        case "discord":
          if (config.webhookUrl) {
            const response = await fetch(config.webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: "Test message from Workspace - Integration is working!",
                embeds: [
                  {
                    title: "Integration Test",
                    description: "This is a test message to verify your Discord integration.",
                    color: 0x5865f2,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            })
            testResult = {
              success: response.ok,
              message: response.ok ? "Discord webhook is working" : "Discord webhook failed",
              latency: Date.now() - startTime,
            }
          }
          break

        case "custom":
          if (config.webhookUrl) {
            const response = await fetch(config.webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(config.customHeaders || {}),
              },
              body: JSON.stringify({
                event: "integration.test",
                timestamp: new Date().toISOString(),
                data: { message: "Test message from Workspace" },
              }),
            })
            testResult = {
              success: response.ok,
              message: response.ok ? "Custom webhook is working" : "Custom webhook failed",
              latency: Date.now() - startTime,
            }
          }
          break

        default:
          testResult = {
            success: true,
            message: `Integration ${integration.service} configured`,
            latency: Date.now() - startTime,
          }
      }
    } catch (err) {
      testResult = {
        success: false,
        message: `Connection failed: ${(err as Error).message}`,
        latency: Date.now() - startTime,
      }
    }

    // Log the test
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "integration.tested",
        resource: "integration",
        resourceId: integrationId,
        metadata: testResult,
      },
    })

    return NextResponse.json(testResult)
  } catch (error) {
    console.error("Failed to test integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
