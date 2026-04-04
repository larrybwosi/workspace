import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // 1. Get all active calls for this workspace
    const calls = await prisma.call.findMany({
      where: {
        status: { in: ['pending', 'active'] },
        metadata: {
            path: ['workspaceId'],
            equals: workspaceId
        }
      },
      include: {
        initiator: true,
        _count: {
            select: { participants: true }
        },
        participants: {
            where: { leftAt: null },
            include: { user: true }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    // 2. Filter calls based on user's access to the associated channel
    const filteredCalls = [];
    for (const call of calls) {
        // Extract channelId from channelName if possible (format: "channel-[id]")
        const channelIdMatch = call.channelName.match(/^channel-(.+)$/);
        if (channelIdMatch) {
            const channelId = channelIdMatch[1];
            const channel = await prisma.channel.findUnique({
                where: { id: channelId },
                select: { isPrivate: true, members: { where: { userId: session.user.id } } }
            });

            // If private and user not a member, skip
            if (channel?.isPrivate && channel.members.length === 0) {
                continue;
            }
        }

        // Handle DMs: Only participants can see/join
        if (call.channelName.startsWith('dm-')) {
            const isParticipant = call.channelName.includes(session.user.id);
            if (!isParticipant) continue;
        }

        filteredCalls.push(call);
    }

    return NextResponse.json({ calls: filteredCalls });
  } catch (error) {
    console.error("Error fetching active calls:", error);
    return NextResponse.json({ error: "Failed to fetch active calls" }, { status: 500 });
  }
}
