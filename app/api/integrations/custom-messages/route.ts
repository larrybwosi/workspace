import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateApiKey, hasPermission } from "@/lib/api-auth"
import { CustomMessageUIDefinitionSchema } from "@/lib/custom-message-schema"
import { z } from "zod"

const customMessagePayloadSchema = z.object({
  definition: CustomMessageUIDefinitionSchema,
  targetChannelId: z.string().cuid().optional(),
  targetUserIds: z.array(z.string().cuid()).optional(),
  targetEmails: z.array(z.string().email()).optional(),
})

/**
 * POST /api/integrations/custom-messages
 *
 * Send a custom message with UI definition to users or channels
 *
 * Example: ERP system sending approval request
 *
 * Body:
 * {
 *   "definition": {
 *     "title": "Purchase Order Approval",
 *     "type": "approval",
 *     "priority": "high",
 *     "icon": "💼",
 *     "components": [
 *       {
 *         "type": "card",
 *         "props": { "title": "Order Details" },
 *         "children": [
 *           { "type": "table", "props": { "headers": [...], "rows": [...] } },
 *           { "type": "progress", "props": { "label": "Budget Used", "value": 75 } }
 *         ]
 *       }
 *     ],
 *     "actions": [
 *       { "id": "approve", "label": "Approve", "type": "primary", "handler": "approve" },
 *       { "id": "reject", "label": "Reject", "type": "destructive", "handler": "reject" }
 *     ],
 *     "metadata": {
 *       "source": "ERP",
 *       "sourceId": "PO-12345",
 *       "tags": ["purchase", "approval"]
 *     }
 *   },
 *   "targetChannelId": "channel-procurement",
 *   "targetUserIds": ["user-123", "user-456"]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate API key
    const apiContext = await authenticateApiKey(request)
    if (!apiContext) {
      return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(apiContext, "messages:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Validate request body
    const body = await request.json()
    const validatedData = customMessagePayloadSchema.parse(body)

    if (!validatedData.targetChannelId && !validatedData.targetUserIds?.length && !validatedData.targetEmails?.length) {
      return NextResponse.json(
        { error: "Must specify at least one target: targetChannelId, targetUserIds, or targetEmails" },
        { status: 400 },
      )
    }

    const messages: any[] = []

    // Send to channel
    if (validatedData.targetChannelId) {
      const channel = await prisma.channel.findUnique({
        where: { id: validatedData.targetChannelId },
        include: { members: true },
      })

      if (!channel) {
        return NextResponse.json({ error: "Channel not found" }, { status: 404 })
      }

      // Create system thread in channel if needed
      const systemThread = await prisma.thread.create({
        data: {
          title: validatedData.definition.title,
          channelId: validatedData.targetChannelId,
          creatorId: apiContext.userId,
        },
      })

      const message = await prisma.message.create({
        data: {
          threadId: systemThread.id,
          userId: apiContext.userId,
          content: validatedData.definition.title,
          messageType: "custom_integration",
          metadata: {
            definition: validatedData.definition,
            type: "custom_ui",
          },
        },
      })

      messages.push(message)
    }

    // Send to specific users
    if (validatedData.targetUserIds?.length) {
      for (const userId of validatedData.targetUserIds) {
        // Create or find DM thread
        const dmThread = await prisma.thread.findFirst({
          where: {
            channel: {
              type: "dm",
              members: {
                some: { userId },
              },
            },
          },
        })

        if (dmThread) {
          const message = await prisma.message.create({
            data: {
              threadId: dmThread.id,
              userId: apiContext.userId,
              content: validatedData.definition.title,
              messageType: "custom_integration",
              metadata: {
                definition: validatedData.definition,
                type: "custom_ui",
              },
            },
          })

          messages.push(message)
        }
      }
    }

    // Send to users by email
    if (validatedData.targetEmails?.length) {
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: validatedData.targetEmails,
          },
        },
      })

      for (const user of users) {
        // Similar DM thread logic
        const message = await prisma.message.create({
          data: {
            threadId: "", // Would be set to actual DM thread
            userId: apiContext.userId,
            content: validatedData.definition.title,
            messageType: "custom_integration",
            metadata: {
              definition: validatedData.definition,
              type: "custom_ui",
            },
          },
        })

        messages.push(message)
      }
    }

    return NextResponse.json(
      {
        success: true,
        messageCount: messages.length,
        messages,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    console.error("[v0] Custom message error:", error)
    return NextResponse.json({ error: "Failed to send custom message" }, { status: 500 })
  }
}
