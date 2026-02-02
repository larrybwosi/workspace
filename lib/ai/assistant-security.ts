import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { headers } from "next/headers"


export interface SecurityContext {
  userId: string
  ipAddress: string
  userAgent: string
  permissions: string[]
}

export async function getSecurityContext(userId: string): Promise<SecurityContext> {
  const headersList = headers()
  const ipAddress = (headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown").split(",")[0].trim()
  const userAgent = headersList.get("user-agent") || "unknown"

  // Get user's role-based permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  const permissions = getRolePermissions(user?.role || "Development")

  return {
    userId,
    ipAddress,
    userAgent,
    permissions,
  }
}

function getRolePermissions(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    Admin: ["read:all", "write:all", "delete:all", "manage:users", "manage:projects"],
    Management: ["read:all", "write:projects", "write:tasks", "read:analytics", "manage:teams"],
    Development: ["read:projects", "read:tasks", "write:tasks", "read:notes", "write:notes"],
    Design: ["read:projects", "read:tasks", "write:tasks", "read:notes", "write:notes"],
  }

  return permissionMap[role] || permissionMap.Development
}

export async function checkPermission(context: SecurityContext, action: string, resourceType?: string): Promise<boolean> {
  // Check if user has global permission
  if (context.permissions.includes(`${action}:all`)) {
    return true
  }

  // Check resource-specific permission
  if (resourceType && context.permissions.includes(`${action}:${resourceType}`)) {
    return true
  }

  return false
}

export async function logAssistantActivity(data: {
  userId: string
  action: string
  resourceType?: string
  resourceId?: string
  query?: string
  response?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  await prisma.assistantAuditLog.create({
    data,
  })
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(userId: string, limit: number = 50, windowMs: number = 60000): Promise<boolean> {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
}

// Data sanitization
export function sanitizeOutput(data: any, userId: string): any {
  // Remove sensitive fields
  const removeFields = ["password", "secret", "token", "apiKey"]

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeOutput(item, userId))
  }

  if (typeof data === "object" && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (!removeFields.includes(key)) {
        sanitized[key] = sanitizeOutput(value, userId)
      }
    }
    return sanitized
  }

  return data
}

// Input validation
export const conversationSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
  context: z.any().optional(),
})

export const toolCallSchema = z.object({
  toolName: z.string(),
  parameters: z.record(z.any()),
})
