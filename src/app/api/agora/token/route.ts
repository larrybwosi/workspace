import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'
import { agoraConfig } from '@/lib/integrations/agora-config'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelName, uid, role = 'publisher' } = await request.json()

    if (!channelName) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 })
    }

    // Generate Agora RTC token
    const expirationTimeInSeconds = 3600 // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    const token = RtcTokenBuilder.buildTokenWithUid(
      agoraConfig.appId,
      agoraConfig.appCertificate,
      channelName,
      uid || 0,
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs,
      Number(new Date(privilegeExpiredTs * 1000).toDateString())
    );

    return NextResponse.json({ 
      token,
      appId: agoraConfig.appId,
      channelName,
      uid: uid || 0,
      expiresAt: new Date(privilegeExpiredTs * 1000)
    })
  } catch (error) {
    console.error(' Error generating Agora token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
