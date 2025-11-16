import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const search = searchParams.get("search")

    const where: any = {
      OR: [{ creatorId: session.user.id }, { collaborators: { some: { id: session.user.id } } }],
    }

    if (folderId) {
      where.folderId = folderId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        creator: true,
        folder: true,
        tags: true,
        collaborators: true,
        projects: true,
        tasks: true,
      },
      orderBy: {
        lastModified: "desc",
      },
    })

    return NextResponse.json(notes)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, folderId, tags, linkedProjects, linkedTasks, collaborators } = body

    const note = await prisma.note.create({
      data: {
        title: title || "Untitled",
        content: content || "",
        folderId,
        creatorId: session.user.id,
        tags: tags
          ? {
              create: tags.map((tag: string) => ({ tag })),
            }
          : undefined,
        projects: linkedProjects
          ? {
              connect: linkedProjects.map((id: string) => ({ id })),
            }
          : undefined,
        tasks: linkedTasks
          ? {
              connect: linkedTasks.map((id: string) => ({ id })),
            }
          : undefined,
        collaborators: collaborators
          ? {
              connect: collaborators.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        creator: true,
        folder: true,
        tags: true,
        collaborators: true,
        projects: true,
        tasks: true,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}
