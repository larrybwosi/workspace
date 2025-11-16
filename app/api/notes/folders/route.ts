import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folders = await prisma.noteFolder.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        notes: {
          select: {
            id: true,
            title: true,
          },
        },
        subfolders: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(folders)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, icon, parentId } = body

    const folder = await prisma.noteFolder.create({
      data: {
        name,
        icon: icon || "📁",
        userId: session.user.id,
        parentId,
      },
      include: {
        notes: true,
        subfolders: true,
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}
