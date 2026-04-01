import { headers } from "next/headers";
import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'
import { agoraConfig } from '@/lib/integrations/agora-config'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { publishToAbly } from '@/lib/integrations/ably'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, channelId, workspaceId, recipientId } = await request.json()

    if (!type || !workspaceId) {
      return NextResponse.json({ error: 'Type and workspaceId are required' }, { status: 400 })
    }

    // Determine channel name for Agora
    let agoraChannelName = "";
    if (channelId) {
      agoraChannelName = `channel-${channelId}`;
    } else if (recipientId) {
      const participants = [session.user.id, recipientId].sort();
      agoraChannelName = `dm-${participants.join('-')}`;
    } else {
       return NextResponse.json({ error: 'channelId or recipientId is required' }, { status: 400 })
    }

    // Check if there's an active call already
    let call = await prisma.call.findFirst({
        where: {
            channelName: agoraChannelName,
            status: { in: ['pending', 'active'] }
        }
    })

    if (!call) {
        // Create new call
        call = await prisma.call.create({
            data: {
                channelName: agoraChannelName,
                type,
                initiatorId: session.user.id,
                status: 'pending'
            }
        })

        // Notify recipient if DM
        if (recipientId) {
             await publishToAbly(`user-${recipientId}`, 'incoming-call', {
                callId: call.id,
                type,
                initiator: {
                    id: session.user.id,
                    name: session.user.name,
                    image: session.user.image
                },
                workspaceId
            })
        } else if (channelId) {
            // Notify channel members
            await publishToAbly(`channel-${channelId}`, 'channel-call-started', {
                callId: call.id,
                type,
                initiatorId: session.user.id,
                workspaceId
            })
        }
    }

    // Generate Agora RTC token
    const uid = Math.floor(Math.random() * 1000000)
    const expirationTimeInSeconds = 3600 // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

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
      type: call.type
    })
  } catch (error) {
    console.error(' Error starting call:', error)
    return NextResponse.json(
      { error: 'Failed to start call' },
      { status: 500 }
    )
  }
}
