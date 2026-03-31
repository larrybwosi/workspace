import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"
import { z } from "zod"

const createPATSchema = z.object({
  name: z.string().min(1).max(50),
  expiresInDays: z.number().optional(),
  scopes: z.array(z.string()).optional().default(["*"]),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pats = await prisma.personalAccessToken.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(pats)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, expiresInDays, scopes } = createPATSchema.parse(body)

    const token = `pat_${crypto.randomBytes(32).toString("hex")}`
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null

    const pat = await prisma.personalAccessToken.create({
      data: {
        name,
        token,
        userId: session.user.id,
        scopes,
        expiresAt,
      },
    })

    return NextResponse.json({ ...pat, token }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
