import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const channels = await prisma.channel.findMany({
      include: {
        children: true,
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(channels)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, icon, type, description, isPrivate, parentId, members } = body
    console.log(body)

    const channel = await prisma.channel.create({
      data: {
        name,
        icon: icon || "#",
        type: type || "channel",
        description,
        isPrivate: isPrivate || false,
        parentId,
        members: members
          ? {
              create: members.map((userId: string) => ({
                userId,
                role: "member",
              })),
            }
          : undefined,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(channel, { status: 201 })
  } catch (error: any) {
    console.log(error.message)
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 })
  }
}
