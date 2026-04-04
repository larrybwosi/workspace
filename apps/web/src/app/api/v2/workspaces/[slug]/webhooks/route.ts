import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope, logV2Audit } from "@/lib/auth/api-v2-auth"
import { z } from "zod"
import crypto from "crypto"

const createWebhookSchema = z.object({
    name: z.string().min(1).max(100),
    url: z.string().url(),
    events: z.array(z.string()),
    active: z.boolean().optional().default(true),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "webhooks:read")) {
        return NextResponse.json({ error: "Forbidden: Missing webhooks:read scope" }, { status: 403 })
    }

    const webhooks = await prisma.workspaceWebhook.findMany({
        where: { workspaceId: context!.workspaceId },
        orderBy: { createdAt: "desc" },
    })

    await logV2Audit(context!, "webhooks.list", "webhook")

    return NextResponse.json({ webhooks })
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "webhooks:write")) {
        return NextResponse.json({ error: "Forbidden: Missing webhooks:write scope" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const data = createWebhookSchema.parse(body)

        const secret = crypto.randomBytes(32).toString("hex")

        const webhook = await prisma.workspaceWebhook.create({
            data: {
                workspaceId: context!.workspaceId!,
                name: data.name,
                url: data.url,
                events: data.events,
                active: data.active,
                secret,
            },
        })

        await logV2Audit(context!, "webhooks.create", "webhook", webhook.id, { name: data.name, url: data.url })

        return NextResponse.json({ webhook, secret }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
