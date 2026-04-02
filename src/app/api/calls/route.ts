import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { agoraConfig } from '@/lib/integrations/agora-config';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { publishToAbly } from '@/lib/integrations/ably';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, channelId, workspaceId, recipientId, callId: incomingCallId, notifyAll } = await request.json();

    if (!type || !workspaceId) {
      return NextResponse.json({ error: 'Type and workspaceId are required' }, { status: 400 });
    }

    // Determine channel name for Agora
    let agoraChannelName = '';
    let call = null;

    if (incomingCallId) {
      call = await prisma.call.findUnique({
        where: { id: incomingCallId }
      });
      if (call) {
        agoraChannelName = call.channelName;

        // --- Security Check ---
        const targetWorkspaceId = (call.metadata as any)?.workspaceId || workspaceId;

        // 1. Verify user belongs to the workspace
        const isMember = await prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: targetWorkspaceId, userId: session.user.id } }
        });
        if (!isMember) {
          return NextResponse.json({ error: 'Unauthorized: Not a workspace member' }, { status: 403 });
        }

        // 2. If it's a channel call, verify user belongs to the channel if it's private
        const channelMatch = agoraChannelName.match(/^channel-(.+)$/);
        if (channelMatch) {
          const channelId = channelMatch[1];
          const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { members: { where: { userId: session.user.id } } }
          });
          if (channel?.isPrivate && channel.members.length === 0) {
            return NextResponse.json({ error: 'Unauthorized: Not a channel member' }, { status: 403 });
          }
        }

        // 3. If it's a DM call, verify user is a participant
        if (agoraChannelName.startsWith('dm-') && !agoraChannelName.includes(session.user.id)) {
          return NextResponse.json({ error: 'Unauthorized: Not a participant in this DM' }, { status: 403 });
        }
      }
    }

    if (!agoraChannelName) {
        if (channelId) {
          agoraChannelName = `channel-${channelId}`;
        } else if (recipientId) {
          const participants = [session.user.id, recipientId].sort();
          agoraChannelName = `dm-${participants.join('-')}`;
        } else {
          return NextResponse.json({ error: 'channelId, recipientId, or callId is required' }, { status: 400 });
        }
    }

    // Check if there's an active call already
    if (!call) {
        call = await prisma.call.findFirst({
          where: {
            channelName: agoraChannelName,
            status: { in: ['pending', 'active'] },
          },
        });
    }

    if (!call) {
      // Create new call
      call = await prisma.call.create({
        data: {
          channelName: agoraChannelName,
          type,
          initiatorId: session.user.id,
          status: 'pending',
          metadata: { workspaceId }
        },
      });

      // 1. Notify specific recipient (DM)
      if (recipientId) {
        await publishToAbly(`user-${recipientId}`, 'incoming-call', {
          callId: call.id,
          type,
          initiator: {
            id: session.user.id,
            name: session.user.name,
            image: session.user.image,
          },
          workspaceId,
        });
      }
      // 2. Notify all workspace members (Workspace-wide)
      else if (notifyAll) {
        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId },
          include: { user: true }
        });

        for (const member of members) {
          if (member.userId !== session.user.id) {
            await publishToAbly(`user-${member.userId}`, 'incoming-call', {
              callId: call.id,
              type,
              initiator: {
                id: session.user.id,
                name: session.user.name,
                image: session.user.image,
              },
              workspaceId,
            });
          }
        }
      }
      // 3. Notify channel members
      else if (channelId) {
        const members = await prisma.channelMember.findMany({
          where: { channelId },
          include: { user: true }
        });

        for (const member of members) {
          if (member.userId !== session.user.id) {
            await publishToAbly(`user-${member.userId}`, 'incoming-call', {
              callId: call.id,
              type,
              initiator: {
                id: session.user.id,
                name: session.user.name,
                image: session.user.image,
              },
              workspaceId,
            });
          }
        }

        // Also notify via channel channel for status updates
        await publishToAbly(`channel-${channelId}`, 'channel-call-started', {
          callId: call.id,
          type,
          initiatorId: session.user.id,
          workspaceId,
        });
      }
    }

    // Generate Agora RTC token
    const uid = Math.floor(Math.random() * 1000000);
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      agoraConfig.appId,
      agoraConfig.appCertificate,
      agoraChannelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs // Use same for privilege and token expiration
    );

    return NextResponse.json({
      callId: call.id,
      token,
      appId: agoraConfig.appId,
      channelName: agoraChannelName,
      uid,
      type: call.type,
      workspaceId: workspaceId || call.metadata?.workspaceId
    });
  } catch (error) {
    console.error(' Error starting call:', error);
    return NextResponse.json({ error: 'Failed to start call' }, { status: 500 });
  }
}
