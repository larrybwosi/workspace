import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope, logV2Audit } from "@/lib/auth/api-v2-auth"
import crypto from "crypto"

export async function POST(
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
        const existingToken = await prisma.workspaceApiToken.findUnique({
            where: { id: tokenId, workspaceId: context!.workspaceId }
        })

        if (!existingToken) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 })
        }

        const rawToken = `wst_${crypto.randomBytes(32).toString("hex")}`
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")

        const updatedToken = await prisma.workspaceApiToken.update({
            where: { id: tokenId },
            data: {
                token: hashedToken,
                updatedAt: new Date()
            }
        })

        await logV2Audit(context!, "tokens.rotate", "api_token", tokenId, { name: existingToken.name })

        return NextResponse.json({ ...updatedToken, token: rawToken })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
