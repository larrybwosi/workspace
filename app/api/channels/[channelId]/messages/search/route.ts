import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const filter = searchParams.get("filter") || "all"
    const channelId = searchParams.get("channelId")

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const whereClause: any = {
      content: {
        contains: query,
        mode: "insensitive",
      },
    }

    // Apply filters
    if (channelId) {
      whereClause.thread = {
        channelId,
      }
    }

    if (filter === "mentions") {
      whereClause.mentions = {
        some: {
          mention: {
            contains: session.user.name,
          },
        },
      }
    }

    if (filter === "files") {
      whereClause.attachments = {
        some: {},
      }
    }

    if (filter === "links") {
      whereClause.content = {
        contains: "http",
        mode: "insensitive",
      }
    }

    if (filter === "from-me") {
      whereClause.userId = session.user.id
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        user: true,
        thread: {
          include: {
            channel: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 50,
    })

    const results = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      userName: msg.user.name,
      userAvatar: msg.user.avatar,
      timestamp: msg.timestamp,
      channelName: msg.thread.channel.name,
      channelId: msg.thread.channelId,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error(" Message search error:", error)
    return NextResponse.json({ error: "Failed to search messages" }, { status: 500 })
  }
}
