import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            id: session.user.id,
          },
        },
        workspaceId: null // Personal projects only
      },
      include: {
        creator: true,
        members: true,
        tasks: {
          include: {
            assignees: true,
          },
        },
        milestones: true,
        sprints: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon, description, startDate, endDate, members, channels } =
      body;

    // Ensure the current user is always included in members
    const allMemberIds = [...new Set([session.user.id, ...(members || [])])];

    const project = await prisma.project.create({
      data: {
        name,
        icon: icon || "📁",
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "planning",
        creatorId: session.user.id,
        members: {
          connect: allMemberIds.map((id: string) => ({ id })),
        },
        channels: channels
          ? {
              connect: channels.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        creator: true,
        members: true,
        tasks: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}