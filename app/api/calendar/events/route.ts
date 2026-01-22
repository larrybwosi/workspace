import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { syncCalendarEvent } from '@/lib/integrations/calendar-integrations'
import { z } from 'zod'

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['task', 'meeting', 'milestone', 'deadline', 'reminder']),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  attendeeIds: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  color: z.string().optional(),
  recurring: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  reminders: z.array(z.object({
    type: z.enum(['notification', 'email']),
    minutesBefore: z.number(),
  })).optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const type = searchParams.get('type')

  try {
    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (type) {
      where.type = type
    }

    // Get events where user is creator or attendee
    const events = await prisma.calendarEvent.findMany({
      where: {
        ...where,
        OR: [
          { creatorId: session.user.id },
          { attendees: { some: { id: session.user.id } } },
          ...(projectId ? [{
            project: {
              members: { some: { id: session.user.id } }
            }
          }] : []),
        ],
      },
      include: {
        creator: true,
        attendees: true,
        project: {
          select: { id: true, name: true, icon: true },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('[Calendar Events GET Error]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
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
    const body = await request.json()
    const validated = eventSchema.parse(body)

    const event = await prisma.calendarEvent.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type,
        startDate: validated.startDate,
        endDate: validated.endDate,
        allDay: validated.allDay || false,
        location: validated.location,
        color: validated.color,
        recurring: validated.recurring,
        reminders: validated.reminders ? JSON.parse(JSON.stringify(validated.reminders)) : undefined,
        creatorId: session.user.id,
        projectId: validated.projectId,
        taskId: validated.taskId,
        ...(validated.attendeeIds && {
          attendees: {
            connect: validated.attendeeIds.map(id => ({ id })),
          },
        }),
      },
      include: {
        creator: true,
        attendees: true,
        project: true,
      },
    })

    // Create reminders
    if (validated.reminders) {
      await prisma.eventReminder.createMany({
        data: validated.reminders.map(reminder => ({
          eventId: event.id,
          type: reminder.type,
          minutesBefore: reminder.minutesBefore,
        })),
      })
    }

    // Sync with external calendars
    await syncCalendarEvent(session.user.id, event.id, 'create')

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('[Calendar Event POST Error]:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}
