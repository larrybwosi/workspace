import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { publishToAbly, AblyEvents, AblyChannels } from "@/lib/integrations/ably";

// GET /api/dms - Get all DM conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
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
            image: true,
            status: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                readBy: {
                  none: {
                    userId: session.user.id,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    // Format DMs for the sidebar
    const formattedDms = dms.map((dm) => {
      const participant1 = {
        ...dm.participant1,
        avatar: dm.participant1.avatar || dm.participant1.image
      };
      const participant2 = {
        ...dm.participant2,
        avatar: dm.participant2.avatar || dm.participant2.image
      };

      const otherUser =
        dm.participant1Id === session.user.id
          ? participant2
          : participant1;

      const lastMessage = dm.messages[0];

      return {
        id: dm.id,
        creatorId: dm.participant1Id, // Using participant1 as creator for compatibility
        members: [participant1, participant2],
        user: otherUser,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
            }
          : null,
        _count: {
          messages: dm._count.messages, // Unread count
        },
        lastMessageAt: dm.lastMessageAt,
      };
    });

    return NextResponse.json(formattedDms);
  } catch (error) {
    console.error(" Error fetching DMs:", error);
    return NextResponse.json({ error: "Failed to fetch DMs" }, { status: 500 });
  }
}

// POST /api/dms - Create a new DM conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Check if DM already exists
    let dm = await prisma.directMessage.findFirst({
      where: {
        OR: [
          { participant1Id: session.user.id, participant2Id: userId },
          { participant1Id: userId, participant2Id: session.user.id },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
            status: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
            status: true,
          },
        },
      },
    });

    if (!dm) {
      // Create new DM
      dm = await prisma.directMessage.create({
        data: {
          participant1Id: session.user.id,
          participant2Id: userId,
        },
        include: {
          participant1: {
            select: {
              id: true,
              name: true,
              avatar: true,
              image: true,
              status: true,
            },
          },
          participant2: {
            select: {
              id: true,
              name: true,
              avatar: true,
              image: true,
              status: true,
            },
          },
        },
      });
    }

    // Format for response
    const participant1 = {
      ...dm.participant1,
      avatar: dm.participant1.avatar || dm.participant1.image
    };
    const participant2 = {
      ...dm.participant2,
      avatar: dm.participant2.avatar || dm.participant2.image
    };

    const formattedDm = {
      ...dm,
      members: [participant1, participant2],
      creatorId: dm.participant1Id,
    };

    // Notify the other user via Ably
    await publishToAbly(AblyChannels.user(userId), AblyEvents.DM_RECEIVED, {
      dmId: dm.id,
      from: session.user.name,
    });

    return NextResponse.json(formattedDm, { status: 201 });
  } catch (error) {
    console.error(" Error creating DM:", error);
    return NextResponse.json({ error: "Failed to create DM" }, { status: 500 });
  }
}
