import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const note = await prisma.note.findUnique({
      where: { id: params.noteId },
      include: {
        creator: true,
        folder: true,
        tags: true,
        collaborators: true,
        projects: true,
        tasks: true,
        linkedNotes: true,
        linkedBy: true,
      },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    // Check if user has access
    const hasAccess =
      note.creatorId === session.user.id || note.collaborators.some((c) => c.id === session.user.id) || note.isPublic

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, folderId, tags, linkedProjects, linkedTasks, collaborators, isPublic, isFavorite } = body

    const note = await prisma.note.update({
      where: { id: params.noteId },
      data: {
        title,
        content,
        folderId,
        isPublic,
        isFavorite,
        lastModified: new Date(),
        tags: tags
          ? {
              deleteMany: {},
              create: tags.map((tag: string) => ({ tag })),
            }
          : undefined,
        projects: linkedProjects
          ? {
              set: [],
              connect: linkedProjects.map((id: string) => ({ id })),
            }
          : undefined,
        tasks: linkedTasks
          ? {
              set: [],
              connect: linkedTasks.map((id: string) => ({ id })),
            }
          : undefined,
        collaborators: collaborators
          ? {
              set: [],
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

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.note.delete({
      where: { id: params.noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}
