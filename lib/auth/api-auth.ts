import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"

export interface ApiKeyContext {
  apiKey: string
  userId: string
  workspaceId: string
  permissions: string[]
  rateLimit: number
  usageCount: number
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
    workspaceId: "", // Placeholder for workspaceId, not applicable for ApiKey
    permissions: key.permissions as string[],
    rateLimit: 0, // Placeholder for rateLimit, not applicable for ApiKey
    usageCount: 0, // Placeholder for usageCount, not applicable for ApiKey
  }
}

/**
 * Middleware to authenticate API requests using workspace API tokens
 * Automatically derives workspace ID from the token
 */
export async function authenticateWorkspaceApiKey(request: NextRequest): Promise<ApiKeyContext | null> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7) // Remove "Bearer " prefix

  const apiToken = await prisma.workspaceApiToken.findUnique({
    where: { token },
    include: {
      workspace: true,
      createdBy: true,
    },
  })

  if (!apiToken) {
    return null
  }

  // Check expiration
  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return null
  }

  // Update last used timestamp and usage count
  await prisma.workspaceApiToken.update({
    where: { id: apiToken.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  })

  return {
    apiKey: token,
    userId: apiToken.createdById,
    workspaceId: apiToken.workspaceId,
    permissions: (apiToken.permissions as any).actions || [],
    rateLimit: apiToken.rateLimit,
    usageCount: apiToken.usageCount + 1,
  }
}

/**
 * Check if API key has required permission
 */
export function hasPermission(context: ApiKeyContext, permission: string): boolean {
  return context.permissions.includes(permission) || context.permissions.includes("*")
}

/**
 * Check if rate limit is exceeded
 */
export function isRateLimitExceeded(context: ApiKeyContext): boolean {
  // Rate limit is per hour
  return context.usageCount >= context.rateLimit
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  return `sk_${crypto.randomBytes(32).toString("hex")}`
}

/**
 * Generate a new workspace API token
 */
export function generateWorkspaceApiToken(): string {
  return `wst_${crypto.randomBytes(32).toString("hex")}`
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}
