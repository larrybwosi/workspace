import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope } from "@/lib/auth/api-v2-auth"
import { redis } from "@/lib/redis"
import { z } from "zod"

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.string().optional().default("member"),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { context, error } = await authenticateV2(request as any, { slug })
  if (error) return error

  if (!hasScope(context!, "members:read")) {
    return NextResponse.json({ error: "Forbidden: Missing members:read scope" }, { status: 403 })
  }

  // Redis Caching
  const cacheKey = `v2:members:${context!.workspaceId}`
  const cachedMembers = await redis.get(cacheKey)

  if (cachedMembers) {
    return NextResponse.json({ members: JSON.parse(cachedMembers), source: "cache" })
  }

  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId: context!.workspaceId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
        },
      },
    },
  })

  // Cache for 10 minutes
  await redis.setex(cacheKey, 600, JSON.stringify(members))

  return NextResponse.json({ members, source: "database" })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { context, error } = await authenticateV2(request as any, { slug })
  if (error) return error

  if (!hasScope(context!, "members:write")) {
    return NextResponse.json({ error: "Forbidden: Missing members:write scope" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email, role } = addMemberSchema.parse(body)

    const userToAdd = await prisma.user.findUnique({
      where: { email },
    })

    if (!userToAdd) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId: context!.workspaceId!,
        userId: userToAdd.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Invalidate cache
    await redis.del(`v2:members:${context!.workspaceId}`)

    return NextResponse.json({ member: membership }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
