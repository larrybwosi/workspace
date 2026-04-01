import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { redis } from "@/lib/redis"
import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"

export interface ApiV2Context {
    userId: string
    clientId: string
    scopes: string[]
    workspaceId?: string
    workspaceSlug?: string
    isBot?: boolean
    tokenId?: string
}

/**
 * Authentication and Rate Limiting for API V2
 */
export async function authenticateV2(
    request: NextRequest,
    params: { slug?: string }
): Promise<{ context?: ApiV2Context; error?: NextResponse }> {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
    }

    const accessToken = authHeader.substring(7)
    let context: ApiV2Context | undefined
    let rateLimit = 100
    let rateLimitKey = ""

    try {
        if (accessToken.startsWith("wst_")) {
            // Workspace API Token
            const hashedToken = crypto.createHash("sha256").update(accessToken).digest("hex")
            const apiToken = await prisma.workspaceApiToken.findUnique({
                where: { token: hashedToken },
                include: { workspace: true }
            })

            if (!apiToken || (apiToken.expiresAt && apiToken.expiresAt < new Date())) {
                return { error: NextResponse.json({ error: "Invalid or expired API token" }, { status: 401 }) }
            }

            // Map permissions to scopes
            const permissions = (apiToken.permissions as any)?.actions || []
            const scopes = permissions.map((p: string) => {
                // Map 'read:channels' to 'channels:read', etc.
                const [action, resource] = p.split(":")
                return `${resource}:${action === "send" ? "send" : action}`
            })

            context = {
                userId: apiToken.createdById,
                clientId: apiToken.id,
                scopes: scopes,
                workspaceId: apiToken.workspaceId,
                workspaceSlug: apiToken.workspace.slug,
                isBot: true,
                tokenId: apiToken.id
            }

            // Verify workspace slug if provided
            if (params.slug && params.slug !== apiToken.workspace.slug) {
                return { error: NextResponse.json({ error: "Token does not belong to this workspace" }, { status: 403 }) }
            }

            rateLimit = apiToken.rateLimit
            rateLimitKey = `ratelimit:v2:token:${apiToken.id}`

            // Update token usage
            await prisma.workspaceApiToken.update({
                where: { id: apiToken.id },
                data: {
                    lastUsedAt: new Date(),
                    usageCount: { increment: 1 }
                }
            })
        } else {
            // Standard OAuth / Better Auth Token
            const tokenInfo = await (auth.api as any).getOAuthAccessToken({
                headers: request.headers,
                query: {
                    token: accessToken
                }
            }).catch(() => null);

            if (!tokenInfo || new Date(tokenInfo.expiresAt) < new Date()) {
                return { error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }) }
            }

            context = {
                userId: tokenInfo.userId,
                clientId: tokenInfo.clientId,
                scopes: tokenInfo.scopes,
            }

            // Handle workspace slug
            if (params.slug) {
                // Find organization by slug
                const organization = await auth.api.getFullOrganization({
                    headers: request.headers,
                    query: {
                        organizationSlug: params.slug
                    }
                }).catch(() => null);

                if (!organization) {
                    return { error: NextResponse.json({ error: "Workspace not found" }, { status: 404 }) }
                }

                // Verify user is a member of the organization
                const members = await auth.api.listMembers({
                    headers: request.headers,
                    query: {
                        organizationId: organization.id
                    }
                }).catch(() => []);

                const isMember = (Array.isArray(members) ? members : (members as any).members || []).some((m: any) => m.userId === tokenInfo.userId);

                if (!isMember) {
                    return { error: NextResponse.json({ error: "Forbidden: Not a member of this workspace" }, { status: 403 }) }
                }

                context.workspaceId = organization.id
                context.workspaceSlug = organization.slug
            }

            rateLimit = 100
            rateLimitKey = `ratelimit:v2:client:${context.clientId}`
        }

        // Rate Limiting
        const window = 60 // seconds
        const currentRequests = await redis.incr(rateLimitKey)
        if (currentRequests === 1) {
            await redis.expire(rateLimitKey, window)
        }

        if (currentRequests > rateLimit) {
            return { error: NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 }) }
        }

        return { context }
    } catch (error) {
        console.error("V2 Auth Error:", error)
        return { error: NextResponse.json({ error: "Internal server error" }, { status: 500 }) }
    }
}

export function hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes("*")
}

/**
 * Log an audit entry for a V2 API operation
 */
export async function logV2Audit(
    context: ApiV2Context,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: any
) {
    if (!context.workspaceId) return

    try {
        await prisma.workspaceAuditLog.create({
            data: {
                workspaceId: context.workspaceId,
                userId: context.userId,
                action: `v2.${action}`,
                resource,
                resourceId,
                metadata: {
                    ...metadata,
                    isBot: context.isBot,
                    tokenId: context.tokenId,
                    clientId: context.clientId,
                }
            }
        })
    } catch (error) {
        console.error("V2 Audit Log Error:", error)
    }
}
