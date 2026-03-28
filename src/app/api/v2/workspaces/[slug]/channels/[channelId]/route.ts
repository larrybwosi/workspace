import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV2, hasScope } from "@/lib/auth/api-v2-auth"
import { z } from "zod"

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  type: z.enum(["public", "private"]).optional(),
  description: z.string().max(500).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; channelId: string }> }
) {
  const { slug, channelId } = await params
  const { context, error } = await authenticateV2(request, { slug })
  if (error) return error

  if (!hasScope(context!, "channels:read")) {
    return NextResponse.json({ error: "Forbidden: Missing channels:read scope" }, { status: 403 })
  }

  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      workspaceId: context!.workspaceId,
    },
    include: {
      _count: {
        select: { members: true, messages: true }
      }
    }
  })

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  return NextResponse.json({ channel })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; channelId: string }> }
) {
  const { slug, channelId } = await params
  const { context, error } = await authenticateV2(request, { slug })
  if (error) return error

  if (!hasScope(context!, "channels:write")) {
    return NextResponse.json({ error: "Forbidden: Missing channels:write scope" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, icon, type, description } = updateChannelSchema.parse(body)

    const updatedChannel = await prisma.channel.update({
      where: {
        id: channelId,
        workspaceId: context!.workspaceId,
      },
      data: {
        name,
        icon,
        type: type === "private" ? "private" : (type === "public" ? "channel" : undefined),
        isPrivate: type === "private" ? true : (type === "public" ? false : undefined),
        description,
      },
    })

    return NextResponse.json({ channel: updatedChannel })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; channelId: string }> }
) {
  const { slug, channelId } = await params
  const { context, error } = await authenticateV2(request, { slug })
  if (error) return error

  if (!hasScope(context!, "channels:write")) {
    return NextResponse.json({ error: "Forbidden: Missing channels:write scope" }, { status: 403 })
  }

  try {
    await prisma.channel.delete({
      where: {
        id: channelId,
        workspaceId: context!.workspaceId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
