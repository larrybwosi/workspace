import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const channel = await prisma.channel.findUnique({
      where: { id: params.channelId },
      include: {
        children: true,
        members: {
          include: {
            user: true,
          },
        },
        threads: {
          include: {
            messages: {
              include: {
                user: true,
                reactions: true,
                attachments: true,
              },
              orderBy: {
                timestamp: "asc",
              },
            },
          },
        },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    return NextResponse.json(channel)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch channel" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const channel = await prisma.channel.update({
      where: { id: params.channelId },
      data: body,
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(channel)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.channel.delete({
      where: { id: params.channelId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 })
  }
}
