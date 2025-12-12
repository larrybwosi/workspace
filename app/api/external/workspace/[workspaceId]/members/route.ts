import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/ably"

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["member", "guest"]).optional().default("member"),
  departmentId: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
  title: z.string().optional(),
  sendInvite: z.boolean().optional().default(true),
})

const bulkAddMembersSchema = z.object({
  members: z.array(addMemberSchema).min(1).max(100),
})

async function validateApiToken(request: NextRequest, workspaceId: string) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice(7)

  const apiToken = await prisma.workspaceApiToken.findUnique({
    where: { token },
  })

  if (!apiToken || apiToken.workspaceId !== workspaceId) {
    return null
  }

  // Check expiration
  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return null
  }

  // Update usage
  await prisma.workspaceApiToken.update({
    where: { id: apiToken.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  })

  return apiToken
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const apiToken = await validateApiToken(request, workspaceId)

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid or expired API token" }, { status: 401 })
    }

    const permissions = apiToken.permissions as any
    if (!permissions?.actions?.includes("read:members")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get("departmentId")
    const teamId = searchParams.get("teamId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)

    const where: any = { workspaceId }
    if (departmentId) where.departmentId = departmentId

    let members = await prisma.workspaceMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
        department: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Filter by team if specified
    if (teamId) {
      const teamMembers = await prisma.workspaceTeamMember.findMany({
        where: { teamId },
        select: { userId: true },
      })
      const teamUserIds = new Set(teamMembers.map((m) => m.userId))
      members = members.filter((m) => teamUserIds.has(m.userId))
    }

    const total = await prisma.workspaceMember.count({ where })

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        departmentId: m.departmentId,
        department: m.department,
        title: m.title,
        teamIds: m.teamIds,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[v0] External API - Failed to fetch members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const apiToken = await validateApiToken(request, workspaceId)

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid or expired API token" }, { status: 401 })
    }

    const permissions = apiToken.permissions as any
    if (!permissions?.actions?.includes("write:members")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()

    // Support both single and bulk operations
    const isBulk = Array.isArray(body.members)
    const membersToAdd = isBulk ? bulkAddMembersSchema.parse(body).members : [addMemberSchema.parse(body)]

    const results: any[] = []
    const errors: any[] = []

    for (const memberData of membersToAdd) {
      try {
        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: memberData.email },
        })

        if (!user) {
          // Create placeholder user (will be activated on first login)
          user = await prisma.user.create({
            data: {
              email: memberData.email,
              name: memberData.email.split("@")[0],
              status: "pending",
            },
          })
        }

        // Check if already a member
        const existingMember = await prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId: user.id } },
        })

        if (existingMember) {
          // Update existing member
          const updated = await prisma.workspaceMember.update({
            where: { id: existingMember.id },
            data: {
              departmentId: memberData.departmentId,
              teamIds: memberData.teamIds || [],
              title: memberData.title,
            },
            include: { user: true },
          })
          results.push({ action: "updated", member: updated })
        } else {
          // Create new member
          const newMember = await prisma.workspaceMember.create({
            data: {
              workspaceId,
              userId: user.id,
              role: memberData.role || "member",
              departmentId: memberData.departmentId,
              teamIds: memberData.teamIds || [],
              title: memberData.title,
            },
            include: { user: true },
          })

          // Add to teams
          if (memberData.teamIds && memberData.teamIds.length > 0) {
            await prisma.workspaceTeamMember.createMany({
              data: memberData.teamIds.map((teamId) => ({
                teamId,
                userId: user!.id,
                role: "member",
              })),
              skipDuplicates: true,
            })
          }

          results.push({ action: "created", member: newMember })
        }
      } catch (err: any) {
        errors.push({ email: memberData.email, error: err.message })
      }
    }

    // Notify workspace
    if (results.length > 0) {
      const ably = getAblyServer()
      const channel = ably.channels.get(AblyChannels.workspace(workspaceId))
      await channel.publish(EVENTS.WORKSPACE_UPDATED, {
        type: "members_added_via_api",
        count: results.length,
      })

      await prisma.workspaceAuditLog.create({
        data: {
          workspaceId,
          userId: apiToken.createdById,
          action: "members.added_via_api",
          resource: "workspace",
          resourceId: workspaceId,
          metadata: {
            count: results.length,
            tokenName: apiToken.name,
            errors: errors.length,
          },
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: membersToAdd.length,
          successful: results.length,
          failed: errors.length,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[v0] External API - Failed to add members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
