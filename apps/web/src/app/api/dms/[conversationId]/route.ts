import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dm = await prisma.directMessage.findUnique({
      where: { id: conversationId },
      include: {
        participant1: {
          select: { id: true, name: true, avatar: true, image: true, status: true },
        },
        participant2: {
          select: { id: true, name: true, avatar: true, image: true, status: true },
        },
      },
    });

    if (!dm) {
      return NextResponse.json({ error: "DM not found" }, { status: 404 });
    }

    const otherUser =
      dm.participant1Id === session.user.id
        ? { ...dm.participant2, avatar: dm.participant2.avatar || dm.participant2.image }
        : { ...dm.participant1, avatar: dm.participant1.avatar || dm.participant1.image };

    return NextResponse.json({
      id: dm.id,
      user: otherUser,
      members: [
        { ...dm.participant1, avatar: dm.participant1.avatar || dm.participant1.image },
        { ...dm.participant2, avatar: dm.participant2.avatar || dm.participant2.image },
      ],
    });
  } catch (error) {
    console.error(" Error fetching DM:", error);
    return NextResponse.json({ error: "Failed to fetch DM" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.directMessage.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(" Error deleting DM:", error);
    return NextResponse.json({ error: "Failed to delete DM" }, { status: 500 });
  }
}
