import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { redis } from "@/lib/redis"

export interface ApiV2Context {
    userId: string
    clientId: string
    scopes: string[]
    workspaceId?: string
    workspaceSlug?: string
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

    try {
        // Use better-auth's verifyAccessToken (provided by oauthProviderResourceClient or available in auth.api)
        // Since we want to use the server-side API:
        const tokenInfo = await (auth.api as any).getOAuthAccessToken({
            headers: request.headers,
            query: {
                token: accessToken
            }
        }).catch(() => null);

        if (!tokenInfo || new Date(tokenInfo.expiresAt) < new Date()) {
            return { error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }) }
        }

        const context: ApiV2Context = {
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

        // Rate Limiting
        const rateLimitKey = `ratelimit:v2:${context.clientId}`
        const limit = 100 // requests per window
        const window = 60 // seconds

        const currentRequests = await redis.incr(rateLimitKey)
        if (currentRequests === 1) {
            await redis.expire(rateLimitKey, window)
        }

        if (currentRequests > limit) {
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
