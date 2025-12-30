import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// GET /api/friends - Get user's friends list
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const friends = await prisma.friend.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { friend: { name: { contains: search, mode: "insensitive" } } },
            { friend: { email: { contains: search, mode: "insensitive" } } },
            { nickname: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
            status: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error("Error fetching friends:", error)
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 })
  }
}
