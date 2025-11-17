import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { token, platform, deviceInfo } = body

    if (!token || !platform) {
      return NextResponse.json({ error: "Token and platform are required" }, { status: 400 })
    }

    // Check if token already exists
    const existing = await prisma.deviceToken.findUnique({
      where: { token },
    })

    if (existing) {
      // Update existing token
      const updated = await prisma.deviceToken.update({
        where: { token },
        data: {
          userId: session.user.id,
          platform,
          deviceInfo,
          isActive: true,
          lastUsedAt: new Date(),
        },
      })
      return NextResponse.json(updated)
    }

    // Create new token
    const deviceToken = await prisma.deviceToken.create({
      data: {
        userId: session.user.id,
        token,
        platform,
        deviceInfo,
      },
    })

    return NextResponse.json(deviceToken)
  } catch (error) {
    console.error(" Device token registration error:", error)
    return NextResponse.json({ error: "Failed to register device token" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        lastUsedAt: "desc",
      },
    })

    return NextResponse.json(deviceTokens)
  } catch (error) {
    console.error(" Device tokens fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch device tokens" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    await prisma.deviceToken.updateMany({
      where: {
        token,
        userId: session.user.id,
      },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(" Device token deletion error:", error)
    return NextResponse.json({ error: "Failed to delete device token" }, { status: 500 })
  }
}
