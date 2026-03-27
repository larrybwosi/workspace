import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"

export interface OAuth2TokenContext {
  accessToken: string
  userId: string
  clientId: string
  scopes: string[]
}

/**
 * Validate an OAuth2 access token
 */
export async function validateOAuth2Token(accessToken: string): Promise<OAuth2TokenContext | null> {
  const token = await prisma.oAuthToken.findUnique({
    where: { accessToken },
    include: { user: true },
  })

  if (!token) return null

  // Check if token has expired
  if (token.expiresAt < new Date()) {
    return null
  }

  return {
    accessToken: token.accessToken,
    userId: token.userId,
    clientId: token.clientId,
    scopes: token.scopes,
  }
}

/**
 * Generate a cryptographically strong random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

/**
 * Check if a set of scopes includes a required scope
 */
export function hasScope(grantedScopes: string[], requiredScope: string): boolean {
  return grantedScopes.includes(requiredScope) || grantedScopes.includes("*")
}
