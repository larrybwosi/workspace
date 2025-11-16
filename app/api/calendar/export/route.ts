import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const format = searchParams.get('format') || 'ics'

  try {
    const where: any = {
      OR: [
        { creatorId: session.user.id },
        { attendees: { some: { id: session.user.id } } },
      ],
    }

    if (projectId) {
      where.projectId = projectId
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        creator: true,
        attendees: true,
      },
      orderBy: { startDate: 'asc' },
    })

    if (format === 'ics') {
      // Generate iCalendar format
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Enterprise Calendar//EN',
        'CALSCALE:GREGORIAN',
      ]

      for (const event of events) {
        const startDate = event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const endDate = event.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        
        icsLines.push(
          'BEGIN:VEVENT',
          `UID:${event.id}`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `DTSTART:${startDate}`,
          `DTEND:${endDate}`,
          `SUMMARY:${event.title}`,
          ...(event.description ? [`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`] : []),
          ...(event.location ? [`LOCATION:${event.location}`] : []),
          `ORGANIZER;CN=${event.creator.name}:mailto:${event.creator.email}`,
          ...event.attendees.map(a => `ATTENDEE;CN=${a.name}:mailto:${a.email}`),
          'END:VEVENT'
        )
      }

      icsLines.push('END:VCALENDAR')

      return new NextResponse(icsLines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/calendar',
          'Content-Disposition': `attachment; filename="calendar-export.ics"`,
        },
      })
    } else if (format === 'json') {
      return NextResponse.json(events)
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error) {
    console.error('[Calendar Export Error]:', error)
    return NextResponse.json(
      { error: 'Failed to export calendar' },
      { status: 500 }
    )
  }
}
