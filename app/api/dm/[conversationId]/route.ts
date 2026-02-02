import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all DM conversations for the current user
    const dms = await prisma.directMessage.findMany({
      where: {
        OR: [
          { participant1Id: session.user.id },
          { participant2Id: session.user.id },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            status: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            readBy: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    // Format DMs with unread count
    const formattedDms = dms.map((dm) => {
      const otherUser =
        dm.participant1Id === session.user.id
          ? dm.participant2
          : dm.participant1;
      const lastMessage = dm.messages[0];
      const unreadCount = dm.messages.filter(
        (msg) => !msg.readBy.some((read) => read.userId === session.user.id)
      ).length;

      return {
        id: dm.id,
        user: otherUser,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
        lastMessageAt: dm.lastMessageAt,
      };
    });

    return NextResponse.json(formattedDms);
  } catch (error) {
    console.error(" Error fetching DMs:", error);
    return NextResponse.json({ error: "Failed to fetch DMs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Check if DM already exists
    const existingDm = await prisma.directMessage.findFirst({
      where: {
        OR: [
          { participant1Id: session.user.id, participant2Id: userId },
          { participant1Id: userId, participant2Id: session.user.id },
        ],
      },
    });

    if (existingDm) {
      return NextResponse.json(existingDm);
    }

    // Create new DM
    const dm = await prisma.directMessage.create({
      data: {
        participant1Id: session.user.id,
        participant2Id: userId,
      },
      include: {
        participant1: true,
        participant2: true,
      },
    });

    return NextResponse.json(dm, { status: 201 });
  } catch (error) {
    console.error(" Error creating DM:", error);
    return NextResponse.json({ error: "Failed to create DM" }, { status: 500 });
  }
}
