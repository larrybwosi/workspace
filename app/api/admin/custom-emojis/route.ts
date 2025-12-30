import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createEmojiSchema = z.object({
  name: z.string().min(1).max(32),
  shortcode: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_]+$/),
  imageUrl: z.string().url(),
  animated: z.boolean().optional(),
  workspaceId: z.string().optional(),
  category: z.string().optional(),
  isGlobal: z.boolean().optional(),
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
    const search = searchParams.get("search")

    const where: any = {
      isActive: true,
      OR: [{ isGlobal: true }, ...(workspaceId ? [{ workspaceId }] : [])],
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortcode: { contains: search, mode: "insensitive" } },
      ]
    }

    const emojis = await prisma.customEmoji.findMany({
      where,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(emojis)
  } catch (error) {
    console.error("Get custom emojis error:", error)
    return NextResponse.json({ error: "Failed to fetch custom emojis" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEmojiSchema.parse(body)

    // Check for duplicate shortcode
    const existing = await prisma.customEmoji.findFirst({
      where: {
        shortcode: validatedData.shortcode,
        workspaceId: validatedData.workspaceId || null,
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Shortcode already exists" }, { status: 400 })
    }

    const emoji = await prisma.customEmoji.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
    })

    return NextResponse.json(emoji)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Create custom emoji error:", error)
    return NextResponse.json({ error: "Failed to create custom emoji" }, { status: 500 })
  }
}
