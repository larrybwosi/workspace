import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { publishToAbly, AblyChannels } from '@/lib/integrations/ably';

export async function POST(request: NextRequest, { params }: { params: Promise<{ callId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { callId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
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
    const message = await prisma.dMMessage.create({
      data: {
        dmId: dm.id,
        senderId: session.user.id,
        content: `I'm inviting you to a ${call.type} call`,
        // Store call pointer in attachments (DMMessage does not support the 'metadata' field in your schema)
        attachments: {
          create: {
            name: 'Call Invite',
            type: 'call-invite',
            url: `/calls/${callId}`,
            size: '0',
          },
        },
      },
      include: {
        attachments: true,
        sender: true,
      },
    });

    // Notify recipient via Ably
    await publishToAbly(AblyChannels.user(userId), 'dm:received', {
      dmId: dm.id,
      message,
      // You can attach extra metadata directly to the socket payload if the client needs it immediately
      callMetadata: {
        callId: call.id,
        callType: call.type,
        workspaceId: call.metadata ? (call.metadata as any).workspaceId : null,
      },
    });

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error('Error sending call invite:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
