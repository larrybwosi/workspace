import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope, logV2Audit } from "@/lib/auth/api-v2-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; contextId: string }> }
) {
  const { slug, contextId } = await params
  const { context, error } = await authenticateV2(request as any, { slug })
  if (error) return error

  if (!hasScope(context!, "threads:read")) {
    return NextResponse.json({ error: "Forbidden: Missing threads:read scope" }, { status: 403 })
  }

  try {
    const thread = await prisma.thread.findFirst({
      where: {
        channel: { workspaceId: context!.workspaceId },
        tags: { some: { tag: contextId } }
      },
      include: {
        tags: true,
        _count: {
          select: { messages: true }
        }
      }
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found for this context" }, { status: 404 })
    }

    await logV2Audit(context!, "threads.get_by_context", "thread", thread.id, { contextId })

    return NextResponse.json({ thread })
  } catch (error) {
    console.error("V2 Get Thread Context Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
