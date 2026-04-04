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

    if (!hasScope(context!, "threads:read")) {
        return NextResponse.json({ error: "Forbidden: Missing threads:read scope" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")
    const limit = parseInt(searchParams.get("limit") || "20")

    try {
        const threads = await prisma.thread.findMany({
            where: {
                channel: { workspaceId: context!.workspaceId },
                channelId: channelId || undefined
            },
            take: limit,
            orderBy: { updatedAt: "desc" },
            include: {
                creator: { select: { id: true, name: true, avatar: true } },
                channel: { select: { id: true, name: true } },
                _count: { select: { messages: true } },
                tags: true,
                rootMessage: { select: { id: true, content: true } }
            }
        })

        await logV2Audit(context!, "threads.list", "thread", undefined, { channelId })

        return NextResponse.json({ threads })
    } catch (err) {
        console.error("V2 List Threads Error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
