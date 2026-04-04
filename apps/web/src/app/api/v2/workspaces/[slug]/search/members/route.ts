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

    if (!hasScope(context!, "members:read")) {
        return NextResponse.json({ error: "Forbidden: Missing members:read scope" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!query) {
        return NextResponse.json({ error: "Search query 'q' is required" }, { status: 400 })
    }

    try {
        const members = await prisma.workspaceMember.findMany({
            where: {
                workspaceId: context!.workspaceId,
                user: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ]
                }
            },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        status: true,
                        role: true,
                    }
                }
            }
        })

        await logV2Audit(context!, "search.members", "member", undefined, { query })

        return NextResponse.json({ results: members.map(m => m.user) })
    } catch (err) {
        console.error("V2 Search Members Error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
