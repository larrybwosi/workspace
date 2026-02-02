import { prisma } from "@/lib/db/prisma"

export interface GoogleCalendarConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface OutlookCalendarConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface ExternalCalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  location?: string
  attendees?: string[]
  recurring?: string
  reminders?: Array<{ minutes: number; type: string }>
}

export const googleCalendarUtils = {
  getAuthUrl: (config: GoogleCalendarConfig, state: string) => {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  },

  exchangeCodeForTokens: async (config: GoogleCalendarConfig, code: string) => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    return response.json()
  },

  refreshAccessToken: async (config: GoogleCalendarConfig, refreshToken: string) => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    return response.json()
  },

  listEvents: async (accessToken: string, calendarId: string = 'primary') => {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
        new URLSearchParams({
          timeMin: new Date().toISOString(),
          maxResults: '100',
          singleEvents: 'true',
          orderBy: 'startTime',
        }),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    return response.json()
  },

  createEvent: async (accessToken: string, calendarId: string, event: ExternalCalendarEvent) => {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startDate.toISOString() },
          end: { dateTime: event.endDate.toISOString() },
          location: event.location,
          attendees: event.attendees?.map(email => ({ email })),
          reminders: event.reminders ? {
            useDefault: false,
            overrides: event.reminders.map(r => ({ method: r.type, minutes: r.minutes }))
          } : undefined,
        }),
      }
    )
    return response.json()
  },

  updateEvent: async (accessToken: string, calendarId: string, eventId: string, event: Partial<ExternalCalendarEvent>) => {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: event.startDate ? { dateTime: event.startDate.toISOString() } : undefined,
          end: event.endDate ? { dateTime: event.endDate.toISOString() } : undefined,
          location: event.location,
        }),
      }
    )
    return response.json()
  },

  deleteEvent: async (accessToken: string, calendarId: string, eventId: string) => {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    return response.ok
  },
}

export const outlookCalendarUtils = {
  getAuthUrl: (config: OutlookCalendarConfig, state: string) => {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'Calendars.ReadWrite offline_access',
      state,
    })
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  },

  exchangeCodeForTokens: async (config: OutlookCalendarConfig, code: string) => {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    return response.json()
  },

  refreshAccessToken: async (config: OutlookCalendarConfig, refreshToken: string) => {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    return response.json()
  },

  listEvents: async (accessToken: string) => {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/calendar/events?' +
        new URLSearchParams({
          $select: 'subject,start,end,location,attendees',
          $top: '100',
          $orderby: 'start/dateTime',
        }),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    return response.json()
  },

  createEvent: async (accessToken: string, event: ExternalCalendarEvent) => {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: event.title,
        body: { contentType: 'HTML', content: event.description },
        start: { dateTime: event.startDate.toISOString(), timeZone: 'UTC' },
        end: { dateTime: event.endDate.toISOString(), timeZone: 'UTC' },
        location: event.location ? { displayName: event.location } : undefined,
        attendees: event.attendees?.map(email => ({
          emailAddress: { address: email },
          type: 'required',
        })),
      }),
    })
    return response.json()
  },

  updateEvent: async (accessToken: string, eventId: string, event: Partial<ExternalCalendarEvent>) => {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendar/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: event.title,
        body: event.description ? { contentType: 'HTML', content: event.description } : undefined,
        start: event.startDate ? { dateTime: event.startDate.toISOString(), timeZone: 'UTC' } : undefined,
        end: event.endDate ? { dateTime: event.endDate.toISOString(), timeZone: 'UTC' } : undefined,
        location: event.location ? { displayName: event.location } : undefined,
      }),
    })
    return response.json()
  },

  deleteEvent: async (accessToken: string, eventId: string) => {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendar/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return response.ok
  },
}

export async function syncCalendarEvent(
  userId: string,
  eventId: string,
  action: 'create' | 'update' | 'delete'
) {
  const integrations = await prisma.calendarIntegration.findMany({
    where: { userId, syncEnabled: true },
  })

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    include: { attendees: true },
  })

  if (!event && action !== 'delete') return

  for (const integration of integrations) {
    try {
      let externalEventId: string | null = null
      
      const sync = await prisma.calendarSync.findFirst({
        where: { eventId, integrationId: integration.id },
      })

      if (integration.provider === 'google') {
        const config: GoogleCalendarConfig = {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          redirectUri: process.env.GOOGLE_REDIRECT_URI!,
        }

        if (action === 'create' && event) {
          const result = await googleCalendarUtils.createEvent(
            integration.accessToken,
            integration.calendarId || 'primary',
            {
              id: event.id,
              title: event.title,
              description: event.description || undefined,
              startDate: event.startDate,
              endDate: event.endDate,
              location: event.location || undefined,
            }
          )
          externalEventId = result.id
        } else if (action === 'update' && event && sync) {
          await googleCalendarUtils.updateEvent(
            integration.accessToken,
            integration.calendarId || 'primary',
            sync.externalEventId,
            {
              title: event.title,
              description: event.description || undefined,
              startDate: event.startDate,
              endDate: event.endDate,
              location: event.location || undefined,
            }
          )
        } else if (action === 'delete' && sync) {
          await googleCalendarUtils.deleteEvent(
            integration.accessToken,
            integration.calendarId || 'primary',
            sync.externalEventId
          )
        }
      } else if (integration.provider === 'outlook') {
        const config: OutlookCalendarConfig = {
          clientId: process.env.OUTLOOK_CLIENT_ID!,
          clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
          redirectUri: process.env.OUTLOOK_REDIRECT_URI!,
        }

        if (action === 'create' && event) {
          const result = await outlookCalendarUtils.createEvent(integration.accessToken, {
            id: event.id,
            title: event.title,
            description: event.description || undefined,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location || undefined,
          })
          externalEventId = result.id
        } else if (action === 'update' && event && sync) {
          await outlookCalendarUtils.updateEvent(integration.accessToken, sync.externalEventId, {
            title: event.title,
            description: event.description || undefined,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location || undefined,
          })
        } else if (action === 'delete' && sync) {
          await outlookCalendarUtils.deleteEvent(integration.accessToken, sync.externalEventId)
        }
      }

      if (action === 'create' && externalEventId) {
        await prisma.calendarSync.create({
          data: {
            integrationId: integration.id,
            eventId,
            externalEventId,
            provider: integration.provider,
            syncStatus: 'synced',
          },
        })
      } else if (action === 'delete' && sync) {
        await prisma.calendarSync.delete({ where: { id: sync.id } })
      }

      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      })
    } catch (error) {
      console.error(`[Calendar Sync Error] ${integration.provider}:`, error)
      
      if (sync) {
        await prisma.calendarSync.update({
          where: { id: sync.id },
          data: {
            syncStatus: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }
    }
  }
}
