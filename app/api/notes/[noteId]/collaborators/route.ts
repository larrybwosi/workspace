import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyNoteShared } from "@/lib/notifications"

export async function POST(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, userIds } = body
    const usersToAdd = userIds || [userId]

    const note = await prisma.note.update({
      where: { id: params.noteId },
      data: {
        collaborators: {
          connect: usersToAdd.map((id: string) => ({ id })),
        },
      },
      include: {
        collaborators: true,
      },
    })

    for (const id of usersToAdd) {
      await notifyNoteShared(params.noteId, id, session.user.name)
    }

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: "Failed to add collaborator" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const note = await prisma.note.update({
      where: { id: params.noteId },
      data: {
        collaborators: {
          disconnect: { id: userId },
        },
      },
      include: {
        collaborators: true,
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 })
  }
}
