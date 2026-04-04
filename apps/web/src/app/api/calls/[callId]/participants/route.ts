import { headers } from "next/headers";
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { callId } = await params

    const participants = await prisma.callParticipant.findMany({
      where: {
        callId,
        leftAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(participants)
  } catch (error) {
    console.error(' Error fetching participants:', error)
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }
}
