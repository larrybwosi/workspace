import { NextRequest, NextResponse } from "next/server"
import { streamText, tool } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { mcpTools } from "@/lib/mcp-tools"
import {
  getSecurityContext,
  checkPermission,
  logAssistantActivity,
  checkRateLimit,
  sanitizeOutput,
  conversationSchema,
} from "@/lib/assistant-security"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Rate limiting
    const canProceed = await checkRateLimit(userId, 50, 60000)
    if (!canProceed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Security context
    const securityContext = await getSecurityContext(userId)

    const body = await req.json()
    const { message, conversationId, context } = conversationSchema.parse(body)

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.assistantConversation.findUnique({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 50,
          },
        },
      })
    }

    if (!conversation) {
      conversation = await prisma.assistantConversation.create({
        data: {
          userId,
          title: message.slice(0, 50),
          context: context || {},
        },
        include: {
          messages: true,
        },
      })
    }

    // Save user message
    await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    })

    // Build conversation history
    const messages = [
      {
        role: "system" as const,
        content: `You are an enterprise AI assistant for a collaboration platform. You have access to tasks, projects, notes, and team data.
        
User Information:
- User ID: ${userId}
- Role: ${securityContext.permissions.join(", ")}

Guidelines:
- Be helpful, accurate, and professional
- Use tools when appropriate to provide data-driven answers
- Respect user permissions and data access controls
- Keep responses concise and actionable
- When creating or modifying data, always confirm the action was successful`,
      },
      ...conversation.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ]

    // Convert MCP tools to AI SDK format
    const tools: Record<string, any> = {}
    for (const [name, toolDef] of Object.entries(mcpTools)) {
      tools[name] = tool({
        description: toolDef.description,
        parameters: toolDef.parameters,
        execute: async (params: any) => {
          // Check permissions before executing
          const hasPermission = await checkPermission(securityContext, "write", name.split(/(?=[A-Z])/)[0].toLowerCase())

          if (!hasPermission && name.startsWith("create") || name.startsWith("update") || name.startsWith("delete")) {
            throw new Error("Insufficient permissions")
          }

          // Log tool usage
          await logAssistantActivity({
            userId,
            action: "tool_call",
            resourceType: name,
            query: JSON.stringify(params),
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent,
          })

          // Execute tool with userId context
          const result = await toolDef.execute({ ...params, userId })

          // Log tool result
          await prisma.assistantToolUsage.create({
            data: {
              conversationId: conversation.id,
              toolName: name,
              parameters: params,
              result: result,
              success: true,
            },
          })

          return sanitizeOutput(result, userId)
        },
      })
    }

    // Stream response
    const result = await streamText({
      model: openai("gpt-4-turbo"),
      messages,
      tools,
      maxTokens: 2000,
      temperature: 0.7,
      onFinish: async ({ text, usage, toolCalls, toolResults }) => {
        // Save assistant message
        await prisma.assistantMessage.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            content: text,
            toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
            toolResults: toolResults ? JSON.stringify(toolResults) : null,
            tokens: usage?.totalTokens,
            model: "gpt-4-turbo",
          },
        })

        // Log activity
        await logAssistantActivity({
          userId,
          action: "query",
          query: message,
          response: text.slice(0, 1000),
          metadata: {
            tokens: usage?.totalTokens,
            toolsUsed: toolCalls?.map((tc: any) => tc.toolName),
          },
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
        })
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error: any) {
    console.error("[v0] Assistant error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
