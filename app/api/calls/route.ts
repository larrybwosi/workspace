import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publishToAbly } from '@/lib/ably'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, participantIds, channelId } = await request.json()

    // Create unique channel name for the call
    const channelName = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create call record
    const call = await prisma.call.create({
      data: {
        channelName,
        type,
        initiatorId: session.user.id,
        status: 'pending',
        participants: {
          create: [
            { userId: session.user.id, role: 'host' },
            ...participantIds.map((userId: string) => ({ userId, role: 'participant' }))
          ]
        }
      },
      include: {
        participants: true
      }
    })

    // Notify participants via Ably
    for (const participantId of participantIds) {
      await publishToAbly(`user-${participantId}`, 'call-incoming', {
        callId: call.id,
        initiatorId: session.user.id,
        type,
        channelName
      })
    }

    return NextResponse.json({ call })
  } catch (error) {
    console.error(' Error creating call:', error)
    return NextResponse.json({ error: 'Failed to create call' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const calls = await prisma.call.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id
          }
        },
        ...(status && { status })
      },
      include: {
        participants: true
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json({ calls })
  } catch (error) {
    console.error(' Error fetching calls:', error)
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}
