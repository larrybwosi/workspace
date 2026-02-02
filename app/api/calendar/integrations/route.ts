import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { googleCalendarUtils, outlookCalendarUtils } from '@/lib/integrations/calendar-integrations'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const integrations = await prisma.calendarIntegration.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          provider: true,
          accountEmail: true,
          calendarName: true,
          syncEnabled: true,
          lastSyncAt: true,
          createdAt: true,
        },
      })

      return NextResponse.json(integrations)
    } catch (dbError: any) {
      console.error('[Calendar Integrations DB Error]:', dbError)
      
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      
      throw dbError
    }
  } catch (error) {
    console.error('[Calendar Integrations GET Error]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { provider, code } = await request.json()

    if (!['google', 'outlook'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    let tokens: any
    let accountEmail: string

    if (provider === 'google') {
      const config = {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!,
      }
      tokens = await googleCalendarUtils.exchangeCodeForTokens(config, code)
      
      // Get user email
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }).then(r => r.json())
      accountEmail = userInfo.email
    } else {
      const config = {
        clientId: process.env.OUTLOOK_CLIENT_ID!,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
        redirectUri: process.env.OUTLOOK_REDIRECT_URI!,
      }
      tokens = await outlookCalendarUtils.exchangeCodeForTokens(config, code)
      
      // Get user email
      const userInfo = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }).then(r => r.json())
      accountEmail = userInfo.mail || userInfo.userPrincipalName
    }

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null

    const integration = await prisma.calendarIntegration.create({
      data: {
        userId: session.user.id,
        provider,
        accountEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        syncEnabled: true,
      },
    })

    return NextResponse.json(integration, { status: 201 })
  } catch (error) {
    console.error('[Calendar Integration POST Error]:', error)
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    )
  }
}
