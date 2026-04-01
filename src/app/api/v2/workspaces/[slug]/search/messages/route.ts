import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope, logV2Audit } from "@/lib/auth/api-v2-auth"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "messages:read")) {
        return NextResponse.json({ error: "Forbidden: Missing messages:read scope" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const channelId = searchParams.get("channelId")
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!query) {
        return NextResponse.json({ error: "Search query 'q' is required" }, { status: 400 })
    }

    try {
        const messages = await prisma.message.findMany({
            where: {
                channel: { workspaceId: context!.workspaceId },
                channelId: channelId || undefined,
                content: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            take: limit,
            orderBy: { timestamp: "desc" },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                channel: { select: { id: true, name: true } },
                attachments: true,
                actions: true,
            }
        })

        await logV2Audit(context!, "search.messages", "message", undefined, { query, channelId })

        return NextResponse.json({ results: messages })
    } catch (err) {
        console.error("V2 Search Messages Error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
