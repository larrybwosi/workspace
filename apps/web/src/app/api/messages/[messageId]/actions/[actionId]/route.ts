import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { publishToAbly } from "@repo/shared/server"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ messageId: string; actionId: string }> }
) {
    const { messageId, actionId } = await params
    const session = await auth.api.getSession({ headers: await headers() } as any)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: { actions: true, channel: true }
        })

        if (!message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 })
        }

        // Check if user has access to the channel
        const membership = await prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId: message.channelId,
                    userId: session.user.id
                }
            }
        })

        if (!membership && message.channel.isPrivate) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        const action = message.actions.find(a => a.actionId === actionId)
        if (!action) {
            return NextResponse.json({ error: "Action not found" }, { status: 404 })
        }

        // Log the response
        const actionResponse = await prisma.messageActionResponse.upsert({
            where: {
                actionId_userId: {
                    actionId: action.id,
                    userId: session.user.id,
                }
            },
            update: {
                actionValue: action.value || action.label,
                respondedAt: new Date(),
            },
            create: {
                messageId,
                actionId: action.id,
                userId: session.user.id,
                actionValue: action.value || action.label,
            }
        })

        // Notify via Ably if needed (e.g., to update UI for others)
        await publishToAbly(`channel-${message.channelId}`, "message-action-response", {
            messageId,
            actionId,
            userId: session.user.id,
            actionValue: action.value || action.label,
        })

        return NextResponse.json({ success: true, responseId: actionResponse.id })
    } catch (err) {
        console.error("Message Action Error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
