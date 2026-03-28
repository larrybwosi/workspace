import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { nanoid } from "nanoid"

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = params

    const inviteLinks = await prisma.workspaceInviteLink.findMany({
      where: {
        workspaceId,
      },
      include: {
        createdBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(inviteLinks)
  } catch (error) {
    console.error(" Invite links fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch invite links" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = params
    const body = await request.json()
    const { maxUses, expiresAt } = body

    const inviteLink = await prisma.workspaceInviteLink.create({
      data: {
        workspaceId,
        code: nanoid(10),
        maxUses: maxUses || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: session.user.id,
      },
      include: {
        createdBy: true,
      },
    })

    return NextResponse.json(inviteLink, { status: 201 })
  } catch (error) {
    console.error(" Invite link creation error:", error)
    return NextResponse.json({ error: "Failed to create invite link" }, { status: 500 })
  }
}
