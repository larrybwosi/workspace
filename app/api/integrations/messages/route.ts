import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateApiKey, hasPermission } from "@/lib/api-auth"
import { createIntegrationMessage } from "@/lib/system-messages"
import { z } from "zod"

const messageSchema = z.object({
  threadId: z.string().cuid(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  icon: z.string().optional(),
  linkUrl: z.string().url().optional(),
  linkText: z.string().optional(),
  source: z.string().optional(),
  data: z.record(z.any()).optional(),
})

/**
 * POST /api/integrations/messages
 *
 * Create a system message from an external integration
 *
 * Headers:
 *   x-api-key: Your API key
 *
 * Body:
 *   {
 *     "threadId": "channel-id-or-thread-id",
 *     "title": "System Update",
 *     "message": "Inventory levels updated",
 *     "icon": "📦",
 *     "linkUrl": "https://erp.example.com/inventory",
 *     "linkText": "View in ERP",
 *     "source": "ERP System",
 *     "data": { "itemCount": 150 }
 *   }
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
    const validatedData = messageSchema.parse(body)

    // Verify thread exists and user has access
    const thread = await prisma.thread.findUnique({
      where: { id: validatedData.threadId },
      include: {
        channel: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Check if user is a member of the channel
    const isMember = thread.channel.members.some((member) => member.userId === apiContext.userId)

    if (!isMember && !thread.channel.isPrivate) {
      // Allow public channels, deny private ones
    } else if (!isMember) {
      return NextResponse.json({ error: "Access denied to this thread" }, { status: 403 })
    }

    // Create the integration message
    const message = await createIntegrationMessage(validatedData.threadId, validatedData)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    console.error("[v0] Integration message error:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
