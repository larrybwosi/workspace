import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope, logV2Audit } from "@/lib/auth/api-v2-auth"
import { z } from "zod"
import crypto from "crypto"

const createTokenSchema = z.object({
    name: z.string().min(1).max(100),
    permissions: z.object({
        actions: z.array(
            z.enum([
                "read:members",
                "write:members",
                "read:departments",
                "write:departments",
                "read:teams",
                "write:teams",
                "read:announcements",
                "write:announcements",
                "read:channels",
                "write:channels",
                "send:messages",
                "read:messages",
                "read:threads",
                "read:webhooks",
                "write:webhooks",
                "read:tokens",
                "write:tokens",
            ]),
        ),
    }),
    rateLimit: z.number().min(100).max(100000).optional().default(1000),
    expiresAt: z.string().datetime().optional().nullable(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "tokens:read")) {
        return NextResponse.json({ error: "Forbidden: Missing tokens:read scope" }, { status: 403 })
    }

    const tokens = await prisma.workspaceApiToken.findMany({
        where: { workspaceId: context!.workspaceId },
        select: {
            id: true,
            name: true,
            token: true,
            permissions: true,
            rateLimit: true,
            expiresAt: true,
            lastUsedAt: true,
            usageCount: true,
            createdAt: true,
            createdBy: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    // Mask tokens
    const maskedTokens = tokens.map((t) => ({
        ...t,
        token: `wst_${"*".repeat(24)}${t.token.slice(-8)}`,
    }))

    await logV2Audit(context!, "tokens.list", "api_token")

    return NextResponse.json({ tokens: maskedTokens })
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "tokens:write")) {
        return NextResponse.json({ error: "Forbidden: Missing tokens:write scope" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const data = createTokenSchema.parse(body)

        const rawToken = `wst_${crypto.randomBytes(32).toString("hex")}`
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")

        const apiToken = await prisma.workspaceApiToken.create({
            data: {
                workspaceId: context!.workspaceId!,
                name: data.name,
                token: hashedToken,
                permissions: data.permissions as any,
                rateLimit: data.rateLimit,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                createdById: context!.userId,
            },
        })

        await logV2Audit(context!, "tokens.create", "api_token", apiToken.id, { name: data.name })

        return NextResponse.json({ ...apiToken, token: rawToken }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
