import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = params

    const badges = await prisma.userBadgeAssignment.findMany({
      where: {
        userId,
        isVisible: true,
      },
      include: {
        badge: true,
      },
      orderBy: [{ isPrimary: "desc" }, { earnedAt: "desc" }],
    })

    return NextResponse.json(badges)
  } catch (error) {
    console.error("Get user badges error:", error)
    return NextResponse.json({ error: "Failed to fetch user badges" }, { status: 500 })
  }
}
