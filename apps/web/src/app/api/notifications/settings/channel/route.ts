import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 })
    }

    const member = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id,
        },
      },
      select: {
        notificationPreference: true,
      },
    })

    return NextResponse.json(member || { notificationPreference: null })
  } catch (error) {
    console.error("Failed to fetch channel notification settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, preference } = body

    if (!channelId || preference === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const updatedMember = await prisma.channelMember.update({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id,
        },
      },
      data: {
        notificationPreference: preference,
      },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Failed to update channel notification settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
