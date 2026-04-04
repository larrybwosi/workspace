import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageIds } = await request.json();

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: "No message IDs provided" }, { status: 400 });
    }

    // Create read records for each message
    const readPromises = messageIds.map((messageId) =>
      prisma.dmMessageRead.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId: session.user.id,
          },
        },
        update: {
          readAt: new Date(),
        },
        create: {
          messageId,
          userId: session.user.id,
        },
      })
    );

    await Promise.all(readPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(" Error marking messages as read:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
