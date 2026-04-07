import type { NextRequest } from "next/server"
import { prisma } from "../db/prisma"
import crypto from "crypto"
import { validateOAuth2Token } from "./oauth2"

export interface ApiContext {
  token: string
  userId: string
  workspaceId?: string
  permissions: string[]
  rateLimit: number
  usageCount: number
  authType: "oauth2" | "pat" | "workspace_token"
}

/**
 * Unified authentication for API V1
 */
export async function authenticateV1(request: NextRequest): Promise<ApiContext | null> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)

  // 1. Check if it's a Personal Access Token (PAT)
  if (token.startsWith("pat_")) {
    const pat = await prisma.personalAccessToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (pat && (!pat.expiresAt || pat.expiresAt > new Date())) {
      await prisma.personalAccessToken.update({
        where: { id: pat.id },
        data: { lastUsedAt: new Date() },
      })

      return {
        token,
        userId: pat.userId,
        permissions: pat.scopes,
        rateLimit: 1000, // Default for PAT
        usageCount: 0,
        authType: "pat",
      }
    }
  }

  // 2. Check if it's a Workspace API Token
  if (token.startsWith("wst_")) {
    const apiToken = await prisma.workspaceApiToken.findUnique({
      where: { token },
    })

    if (apiToken && (!apiToken.expiresAt || apiToken.expiresAt > new Date())) {
      await prisma.workspaceApiToken.update({
        where: { id: apiToken.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 },
        },
      })

      return {
        token,
        userId: apiToken.createdById,
        workspaceId: apiToken.workspaceId,
        permissions: (apiToken.permissions as any).actions || [],
        rateLimit: apiToken.rateLimit,
        usageCount: apiToken.usageCount + 1,
        authType: "workspace_token",
      }
    }
  }

  // 3. Check if it's an OAuth2 Access Token
  const oauthContext = await validateOAuth2Token(token)
  if (oauthContext) {
    return {
      token,
      userId: oauthContext.userId,
      permissions: oauthContext.scopes,
      rateLimit: 5000, // Higher limit for OAuth2 apps
      usageCount: 0,
      authType: "oauth2",
    }
  }

  return null
}

/**
 * Check if token has required permission/scope
 */
export function hasPermission(context: ApiContext, permission: string): boolean {
  return context.permissions.includes(permission) || context.permissions.includes("*")
}

/**
 * Check if rate limit is exceeded
 */
export function isRateLimitExceeded(context: ApiContext): boolean {
  return context.usageCount >= context.rateLimit
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}
