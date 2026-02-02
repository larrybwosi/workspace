import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { getAblyServer } from "@/lib/integrations/ably"

const createStatusUpdateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  status: z.enum(["on_track", "at_risk", "off_track", "completed"]),
  visibility: z.enum(["team", "workspace", "public"]).optional(),
  notifyTeam: z.boolean().optional(),
  achievements: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest, { params }: { params: { workspaceId: string; projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await prisma.projectStatusUpdate.findMany({
      where: {
        projectId: params.projectId,
        workspaceId: params.workspaceId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ updates })
  } catch (error) {
    console.error("[STATUS_UPDATES_GET]", error)
    return NextResponse.json({ error: "Failed to fetch status updates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { workspaceId: string; projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createStatusUpdateSchema.parse(body)

    const update = await prisma.projectStatusUpdate.create({
      data: {
        ...validatedData,
        projectId: params.projectId,
        workspaceId: params.workspaceId,
        authorId: session.user.id,
        achievements: validatedData.achievements || [],
        challenges: validatedData.challenges || [],
        nextSteps: validatedData.nextSteps || [],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          include: {
            members: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Send real-time notification
    if (validatedData.notifyTeam !== false) {
      const ably = getAblyServer()
      const channel = ably.channels.get(`workspace:${params.workspaceId}`)

      await channel.publish("project.status_update", {
        projectId: params.projectId,
        updateId: update.id,
        status: update.status,
        title: update.title,
        authorName: update.author.name,
      })
    }

    // Create audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: session.user.id,
        action: "project.status_update_created",
        details: {
          projectId: params.projectId,
          updateId: update.id,
          status: update.status,
        },
      },
    })

    return NextResponse.json(update, { status: 201 })
  } catch (error) {
    console.error("[STATUS_UPDATES_POST]", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create status update" }, { status: 500 })
  }
}
