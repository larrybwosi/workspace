import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export interface ApiKeyContext {
  apiKey: string
  userId: string
  permissions: string[]
}

/**
 * Middleware to authenticate API requests using API keys
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyContext | null> {
  const apiKey = request.headers.get("x-api-key")

  if (!apiKey) {
    return null
  }

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { user: true },
  })

  if (!key || !key.isActive) {
    return null
  }

  // Check expiration
  if (key.expiresAt && key.expiresAt < new Date()) {
    return null
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    apiKey: key.key,
    userId: key.userId,
    permissions: key.permissions as string[],
  }
}

/**
 * Check if API key has required permission
 */
export function hasPermission(context: ApiKeyContext, permission: string): boolean {
  return context.permissions.includes(permission) || context.permissions.includes("*")
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  return `sk_${crypto.randomBytes(32).toString("hex")}`
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}
