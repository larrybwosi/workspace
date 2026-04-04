import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { nanoid } from "nanoid"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params

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
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params
    const body = await (request.json().catch(() => ({})))
    const { maxUses, expiresAt } = body

    // Return existing link if it exists and was created by the same user
    const existingLink = await prisma.workspaceInviteLink.findFirst({
      where: {
        workspaceId,
        createdById: session.user.id,
        // For existing link return, we ignore maxUses and expiresAt unless they were specifically requested to be updated
        // but the prompt says "return the link" if it exists, so we favor existing one.
      },
      include: {
        createdBy: true,
      }
    })

    if (existingLink) {
      return NextResponse.json(existingLink, { status: 200 })
    }

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
