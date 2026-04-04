import { headers } from "next/headers";
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { publishToAbly } from '@/lib/integrations/ably'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...data } = await request.json()
    const { callId } = await params

    const call = await prisma.call.findUnique({
        where: { id: callId },
        include: { participants: true }
    })

    if (!call) {
        return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const currentParticipant = call.participants.find(p => p.userId === session.user.id)

    if (action === 'join') {
      // Check if user is banned
      if (currentParticipant && currentParticipant.isBanned) {
        return NextResponse.json({ error: 'You are banned from this call' }, { status: 403 })
      }

      await prisma.callParticipant.upsert({
        where: {
          callId_userId: {
            callId,
            userId: session.user.id
          }
        },
        update: {
          leftAt: null,
          joinedAt: new Date(),
          agoraUid: data.uid // Store the Agora UID
        },
        create: {
          callId,
          userId: session.user.id,
          role: call.initiatorId === session.user.id ? 'host' : 'participant',
          agoraUid: data.uid
        }
      })

      // Update call status to active if it was pending
      if (call.status === 'pending') {
          await prisma.call.update({
            where: { id: callId },
            data: { status: 'active' }
          })
      }

      // Notify other participants
      for (const participant of call.participants) {
        if (participant.userId !== session.user.id && !participant.leftAt) {
          await publishToAbly(`user-${participant.userId}`, 'call-joined', {
            callId,
            userId: session.user.id
          })
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
        const duration = Math.floor((Date.now() - call.startedAt.getTime()) / 1000)

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
      for (const participant of call.participants) {
        if (participant.userId !== session.user.id && !participant.leftAt) {
          await publishToAbly(`user-${participant.userId}`, 'participant-state-changed', {
            callId,
            userId: session.user.id,
            ...data
          })
        }
      }
    } else if (action === 'promote') {
        if (currentParticipant?.role !== 'host') {
            return NextResponse.json({ error: 'Only hosts can promote others' }, { status: 403 })
        }

        // data.userId is the Agora UID from frontend, we need to find the participant
        const targetParticipant = call.participants.find(p => p.agoraUid === Number(data.uid))
        if (!targetParticipant) {
             return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
        }

        await prisma.callParticipant.update({
            where: { id: targetParticipant.id },
            data: { role: 'host' }
        })

        for (const participant of call.participants) {
            await publishToAbly(`user-${participant.userId}`, 'participant-promoted', {
                callId,
                userId: targetParticipant.userId,
                agoraUid: targetParticipant.agoraUid
            })
        }
    } else if (action === 'remove') {
        if (currentParticipant?.role !== 'host') {
            return NextResponse.json({ error: 'Only hosts can remove participants' }, { status: 403 })
        }

        const targetParticipant = call.participants.find(p => p.agoraUid === Number(data.uid))
        if (!targetParticipant) {
             return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
        }

        await prisma.callParticipant.update({
            where: { id: targetParticipant.id },
            data: {
                leftAt: new Date(),
                isBanned: true
            }
        })

        for (const participant of call.participants) {
            await publishToAbly(`user-${participant.userId}`, 'participant-removed', {
                callId,
                userId: targetParticipant.userId,
                agoraUid: targetParticipant.agoraUid
            })
        }
    } else if (action === 'endForAll') {
        if (currentParticipant?.role !== 'host') {
            return NextResponse.json({ error: 'Only hosts can end the call for everyone' }, { status: 403 })
        }

        const duration = Math.floor((Date.now() - call.startedAt.getTime()) / 1000)

        await prisma.call.update({
            where: { id: callId },
            data: {
                status: 'ended',
                endedAt: new Date(),
                duration
            }
        })

        for (const participant of call.participants) {
            await publishToAbly(`user-${participant.userId}`, 'call-ended', {
                callId
            })
        }
    } else if (action === 'screenShareStarted') {
        // Broadcaster for screen share focus synchronization
        for (const participant of call.participants) {
            if (participant.userId !== session.user.id && !participant.leftAt) {
                await publishToAbly(`user-${participant.userId}`, 'screen-share-started', {
                    callId,
                    userId: session.user.id,
                    agoraUid: call.participants.find(p => p.userId === session.user.id)?.agoraUid
                })
            }
        }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(' Error updating call:', error)
    return NextResponse.json({ error: 'Failed to update call' }, { status: 500 })
  }
}
