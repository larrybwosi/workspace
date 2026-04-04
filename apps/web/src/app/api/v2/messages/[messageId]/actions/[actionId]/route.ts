import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, logV2Audit } from "@/lib/auth/api-v2-auth"
import { dispatchWebhook } from "@/lib/webhooks"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ messageId: string; actionId: string }> }
) {
    const { messageId, actionId } = await params

    // For action callbacks, we might want to allow regular session auth too,
    // but since this is V2 API, let's stick to V2 auth for now.
    // If called from the UI, it will use the session cookie if authenticateV2 is updated to handle it,
    // OR we can create a separate internal callback endpoint.

    const { context, error } = await authenticateV2(request as any, {})
    if (error) return error

    try {
        const message = await prisma.message.findFirst({
            where: {
                id: messageId,
                channel: { workspaceId: context!.workspaceId }
            },
            include: { actions: true, channel: true }
        })

        if (!message) {
            return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 })
        }

        const action = message.actions.find(a => a.actionId === actionId)
        if (!action) {
            return NextResponse.json({ error: "Action not found" }, { status: 404 })
        }

        // Log the response
        const response = await prisma.messageActionResponse.create({
            data: {
                messageId,
                actionId: action.id,
                userId: context!.userId,
                actionValue: action.value || action.label,
            }
        })

        await logV2Audit(context!, "messages.action", "message_action", action.id, { messageId, actionId })

        // Dispatch webhook
        await dispatchWebhook(message.channel.workspaceId!, "message.action", {
            messageId,
            actionId,
            actionValue: action.value || action.label,
            userId: context!.userId,
            responseId: response.id
        })

        return NextResponse.json({ success: true, responseId: response.id })
    } catch (err) {
        console.error("V2 Message Action Error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
