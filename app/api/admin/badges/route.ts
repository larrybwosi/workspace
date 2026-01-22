import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const createBadgeSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  icon: z.string().min(1),
  color: z.string().min(1),
  bgColor: z.string().min(1),
  tier: z.enum(["standard", "premium", "elite", "legendary"]).optional(),
  category: z.enum(["achievement", "role", "special", "event"]).optional(),
  isGlobal: z.boolean().optional(),
  workspaceId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")
    const category = searchParams.get("category")

    const where: any = {
      isActive: true,
      OR: [{ isGlobal: true }, ...(workspaceId ? [{ workspaceId }] : [])],
    }

    if (category) {
      where.category = category
    }

    const badges = await prisma.userBadge.findMany({
      where,
      include: {
        _count: {
          select: { userBadges: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(badges)
  } catch (error) {
    console.error("Get badges error:", error)
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBadgeSchema.parse(body)

    const badge = await prisma.userBadge.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
    })

    return NextResponse.json(badge)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Create badge error:", error)
    return NextResponse.json({ error: "Failed to create badge" }, { status: 500 })
  }
}
