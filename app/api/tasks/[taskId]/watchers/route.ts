import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { addTaskWatcher, removeTaskWatcher } from "@/lib/notifications"

export async function POST(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    await addTaskWatcher(params.taskId, userId || session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Add watcher error:", error)
    return NextResponse.json({ error: "Failed to add watcher" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    await removeTaskWatcher(params.taskId, userId || session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Remove watcher error:", error)
    return NextResponse.json({ error: "Failed to remove watcher" }, { status: 500 })
  }
}
