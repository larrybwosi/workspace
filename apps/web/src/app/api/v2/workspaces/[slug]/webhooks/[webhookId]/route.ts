import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope, logV2Audit } from "@/lib/auth/api-v2-auth"
import { z } from "zod"

const updateWebhookSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    url: z.string().url().optional(),
    events: z.array(z.string()).optional(),
    active: z.boolean().optional(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; webhookId: string }> }
) {
    const { slug, webhookId } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "webhooks:read")) {
        return NextResponse.json({ error: "Forbidden: Missing webhooks:read scope" }, { status: 403 })
    }

    const webhook = await prisma.workspaceWebhook.findUnique({
        where: { id: webhookId, workspaceId: context!.workspaceId },
        include: { logs: { take: 10, orderBy: { createdAt: "desc" } } }
    })

    if (!webhook) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    await logV2Audit(context!, "webhooks.get", "webhook", webhookId)

    return NextResponse.json({ webhook })
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; webhookId: string }> }
) {
    const { slug, webhookId } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "webhooks:write")) {
        return NextResponse.json({ error: "Forbidden: Missing webhooks:write scope" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const data = updateWebhookSchema.parse(body)

        const webhook = await prisma.workspaceWebhook.update({
            where: { id: webhookId, workspaceId: context!.workspaceId },
            data,
        })

        await logV2Audit(context!, "webhooks.update", "webhook", webhookId, data)

        return NextResponse.json({ webhook })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; webhookId: string }> }
) {
    const { slug, webhookId } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "webhooks:write")) {
        return NextResponse.json({ error: "Forbidden: Missing webhooks:write scope" }, { status: 403 })
    }

    try {
        const webhook = await prisma.workspaceWebhook.findUnique({
            where: { id: webhookId, workspaceId: context!.workspaceId }
        })

        if (!webhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
        }

        await prisma.workspaceWebhook.delete({
            where: { id: webhookId }
        })

        await logV2Audit(context!, "webhooks.delete", "webhook", webhookId, { name: webhook.name })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
