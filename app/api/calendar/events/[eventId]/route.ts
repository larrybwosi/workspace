import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { syncCalendarEvent } from '@/lib/calendar-integrations'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.eventId },
      include: {
        creator: true,
        attendees: true,
        project: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check permissions
    const isCreator = event.creatorId === session.user.id
    const isAttendee = event.attendees.some(a => a.id === session.user.id)
    const isProjectMember = event.projectId ? await prisma.project.findFirst({
      where: {
        id: event.projectId,
        members: { some: { id: session.user.id } },
      },
    }) : null

    if (!isCreator && !isAttendee && !isProjectMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('[Calendar Event GET Error]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await prisma.calendarEvent.findUnique({
      where: { id: params.eventId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existing.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const event = await prisma.calendarEvent.update({
      where: { id: params.eventId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type && { type: body.type }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
        ...(body.allDay !== undefined && { allDay: body.allDay }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.color && { color: body.color }),
        ...(body.recurring !== undefined && { recurring: body.recurring }),
        ...(body.attendeeIds && {
          attendees: {
            set: body.attendeeIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        creator: true,
        attendees: true,
        project: true,
      },
    })

    // Sync with external calendars
    await syncCalendarEvent(session.user.id, event.id, 'update')

    return NextResponse.json(event)
  } catch (error) {
    console.error('[Calendar Event PATCH Error]:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.eventId },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Sync deletion with external calendars
    await syncCalendarEvent(session.user.id, params.eventId, 'delete')

    await prisma.calendarEvent.delete({
      where: { id: params.eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Calendar Event DELETE Error]:', error)
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    )
  }
}
