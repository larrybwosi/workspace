import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope, logV2Audit } from "@/lib/auth/api-v2-auth"

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; tokenId: string }> }
) {
    const { slug, tokenId } = await params
    const { context, error } = await authenticateV2(request as any, { slug })
    if (error) return error

    if (!hasScope(context!, "tokens:write")) {
        return NextResponse.json({ error: "Forbidden: Missing tokens:write scope" }, { status: 403 })
    }

    try {
        const token = await prisma.workspaceApiToken.findUnique({
            where: { id: tokenId, workspaceId: context!.workspaceId }
        })

        if (!token) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 })
        }

        await prisma.workspaceApiToken.delete({
            where: { id: tokenId }
        })

        await logV2Audit(context!, "tokens.delete", "api_token", tokenId, { name: token.name })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
