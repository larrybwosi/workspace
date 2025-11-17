import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversation = await prisma.assistantConversation.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        tools: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(conversation)
  } catch (error: any) {
    console.error(" Get conversation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.assistantConversation.delete({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(" Delete conversation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
