import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversations = await prisma.assistantConversation.findMany({
      where: {
        userId: session.user.id,
        isArchived: false,
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(conversations)
  } catch (error: any) {
    console.error("[v0] Get conversations error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, context } = await req.json()

    const conversation = await prisma.assistantConversation.create({
      data: {
        userId: session.user.id,
        title: title || "New Conversation",
        context: context || {},
      },
    })

    return NextResponse.json(conversation)
  } catch (error: any) {
    console.error("[v0] Create conversation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
