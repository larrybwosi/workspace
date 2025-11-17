import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publishToAbly } from '@/lib/ably'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { callId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...data } = await request.json()
    const { callId } = await params

    if (action === 'join') {
      await prisma.callParticipant.upsert({
        where: {
          callId_userId: {
            callId,
            userId: session.user.id
          }
        },
        update: {
          joinedAt: new Date()
        },
        create: {
          callId,
          userId: session.user.id,
          role: 'participant'
        }
      })

      // Update call status to active if it was pending
      await prisma.call.updateMany({
        where: {
          id: callId,
          status: 'pending'
        },
        data: {
          status: 'active'
        }
      })

      // Notify other participants
      const call = await prisma.call.findUnique({
        where: { id: callId },
        include: { participants: true }
      })

      if (call) {
        for (const participant of call.participants) {
          if (participant.userId !== session.user.id) {
            await publishToAbly(`user-${participant.userId}`, 'call-joined', {
              callId,
              userId: session.user.id
            })
          }
        }
      }
    } else if (action === 'leave') {
      await prisma.callParticipant.update({
        where: {
          callId_userId: {
            callId,
            userId: session.user.id
          }
        },
        data: {
          leftAt: new Date()
        }
      })

      // Check if all participants have left
      const activeParticipants = await prisma.callParticipant.count({
        where: {
          callId,
          leftAt: null
        }
      })

      if (activeParticipants === 0) {
        const call = await prisma.call.findUnique({ where: { id: callId } })
        const duration = call ? Math.floor((Date.now() - call.startedAt.getTime()) / 1000) : 0

        await prisma.call.update({
          where: { id: callId },
          data: {
            status: 'ended',
            endedAt: new Date(),
            duration
          }
        })
      }
    } else if (action === 'updateState') {
      await prisma.callParticipant.update({
        where: {
          callId_userId: {
            callId,
            userId: session.user.id
          }
        },
        data
      })

      // Notify other participants of state change
      const call = await prisma.call.findUnique({
        where: { id: callId },
        include: { participants: true }
      })

      if (call) {
        for (const participant of call.participants) {
          if (participant.userId !== session.user.id) {
            await publishToAbly(`user-${participant.userId}`, 'participant-state-changed', {
              callId,
              userId: session.user.id,
              ...data
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(' Error updating call:', error)
    return NextResponse.json({ error: 'Failed to update call' }, { status: 500 })
  }
}
