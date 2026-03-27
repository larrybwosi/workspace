import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { createSystemMessage } from "@/lib/system-messages"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data, workspaceId } = body

    // Find the default or a related channel for this workspace
    const channel = await prisma.channel.findFirst({
      where: { workspaceId: workspaceId as string },
    })

    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 })

    let message = ""
    switch (event) {
      case "issue.created":
        message = `🚀 Issue created in Plane: **${data.name}**`
        break
      case "issue.updated":
        message = `🔄 Issue updated in Plane: **${data.name}** (Status: ${data.state})`
        break
      default:
        message = `🔗 Plane integration update: ${event}`
    }

    await createSystemMessage(message, {
      channelId: channel.id,
      metadata: { source: "plane", event, data },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Plane Webhook Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
