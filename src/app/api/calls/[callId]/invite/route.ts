import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { publishToAbly, AblyChannels } from "@/lib/integrations/ably";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    // Find or create DM conversation
    let dm = await prisma.directMessage.findFirst({
      where: {
        OR: [
          { participant1Id: session.user.id, participant2Id: userId },
          { participant1Id: userId, participant2Id: session.user.id },
        ],
      },
    });

    if (!dm) {
      dm = await prisma.directMessage.create({
        data: {
          participant1Id: session.user.id,
          participant2Id: userId,
        },
      });
    }

    // Send invite message in DM
    const message = await prisma.dmMessage.create({
      data: {
        dmId: dm.id,
        senderId: session.user.id,
        content: `I'm inviting you to a ${call.type} call`,
        // Store call metadata in attachments
        attachments: {
            create: {
                name: "Call Invite",
                type: "call-invite",
                url: `/calls/${callId}`, // Not really a URL for a file, but identifies the resource
                size: "0", // size is a string, let's keep it as string "0"
            }
        },
        metadata: {
            callId: call.id,
            callType: call.type,
            workspaceId: call.metadata?.workspaceId
        }
      },
      include: {
        attachments: true,
        sender: true
      }
    });

    // Notify recipient via Ably
    await publishToAbly(AblyChannels.user(userId), "dm:received", {
        dmId: dm.id,
        message
    });

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error("Error sending call invite:", error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
