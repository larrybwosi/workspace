import crypto from "crypto"

export async function sendWebhookNotification(workspaceId: string, event: string, payload: any) {
  const { prisma } = await import("@/lib/db/prisma")

  // Find all active webhooks for this workspace that listen to this event
  const webhooks = await prisma.workspaceWebhook.findMany({
    where: {
      workspaceId,
      active: true,
      events: {
        has: event,
      },
    },
  })

  // Send webhook to each endpoint
  const promises = webhooks.map(async (webhook) => {
    try {
      const timestamp = Date.now()
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(`${timestamp}.${JSON.stringify(payload)}`)
        .digest("hex")

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Timestamp": timestamp.toString(),
          "X-Webhook-Event": event,
        },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json().catch(() => null)

      // Log the webhook delivery
      await prisma.workspaceWebhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          response: responseData,
          success: response.ok,
        },
      })

      return { success: response.ok, webhook: webhook.id }
    } catch (error) {
      // Log failed delivery
      await prisma.workspaceWebhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          response: { error: (error as Error).message },
          success: false,
        },
      })
      return { success: false, webhook: webhook.id, error }
    }
  })

  return Promise.all(promises)
}
