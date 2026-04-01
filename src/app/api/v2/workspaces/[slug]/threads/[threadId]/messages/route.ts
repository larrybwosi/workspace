import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope, logV2Audit } from "@/lib/auth/api-v2-auth"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; threadId: string }> }
) {
    const { slug, threadId } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "messages:read") || !hasScope(context!, "threads:read")) {
        return NextResponse.json({ error: "Forbidden: Missing messages:read or threads:read scope" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const cursor = searchParams.get("cursor")

    try {
        const messages = await prisma.message.findMany({
            where: {
                threadId,
                channel: { workspaceId: context!.workspaceId }
            },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { timestamp: "asc" },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                attachments: true,
                reactions: true,
                actions: true,
            }
        })

        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

        await logV2Audit(context!, "threads.messages", "thread", threadId, { limit, cursor })

        return NextResponse.json({ messages, nextCursor })
    } catch (err) {
        console.error("V2 Thread Messages Error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
