import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  generateInvitationToken,
  generateInvitationLink,
  getInvitationExpiry,
  sendInvitationEmail,
} from "@/lib/invitation-utils"
import { z } from "zod"

const invitationSchema = z.object({
  email: z.string().email(),
  role: z.string().optional().default("member"),
  projectId: z.string().optional(),
  channelId: z.string().optional(),
  permissions: z.record(z.boolean()).optional(),
})

// POST /api/invitations - Create new invitation
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = invitationSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: validatedData.email,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    })

    if (existingInvitation) {
      return NextResponse.json({ error: "A pending invitation already exists for this email" }, { status: 400 })
    }

    const token = generateInvitationToken()
    const invitationLink = generateInvitationLink(token)

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: validatedData.email,
        token,
        role: validatedData.role,
        invitedBy: session.user.id,
        projectId: validatedData.projectId,
        channelId: validatedData.channelId,
        permissions: validatedData.permissions || {},
        expiresAt: getInvitationExpiry(),
      },
    })

    // Log invitation creation
    await prisma.invitationLog.create({
      data: {
        invitationId: invitation.id,
        action: "sent",
        metadata: { sentTo: validatedData.email },
      },
    })

    // Get project name if applicable
    let projectName: string | undefined
    if (validatedData.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validatedData.projectId },
        select: { name: true },
      })
      projectName = project?.name
    }

    // Send invitation email
    await sendInvitationEmail(validatedData.email, invitationLink, session.user.name, projectName)

    return NextResponse.json({
      invitation,
      invitationLink,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("[v0] Error creating invitation:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}

// GET /api/invitations - List user's sent invitations
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const invitations = await prisma.invitation.findMany({
      where: {
        invitedBy: session.user.id,
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("[v0] Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}
