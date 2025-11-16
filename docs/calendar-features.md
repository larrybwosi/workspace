# Enterprise Calendar Features

## Overview

The enterprise calendar system provides comprehensive scheduling, integration, and collaboration features for modern teams.

## Features

### 1. Calendar Views

- **Month View**: Traditional monthly calendar grid
- **Week View**: Detailed weekly schedule
- **Day View**: Hour-by-hour daily agenda
- **Agenda View**: List of upcoming events

### 2. Event Management

#### Event Types
- **Tasks**: Linked to project tasks with automatic sync
- **Meetings**: Team meetings with attendee management
- **Milestones**: Project milestone markers
- **Deadlines**: Important deadline reminders
- **Reminders**: Personal reminders

#### Event Features
- Recurring events (daily, weekly, monthly, yearly)
- All-day events
- Location support (physical or virtual)
- Attendee management
- Custom event colors
- Event reminders (notification, email)
- Rich descriptions with formatting

### 3. External Calendar Integrations

#### Google Calendar
\`\`\`typescript
// Connect Google Calendar
POST /api/calendar/integrations
{
  "provider": "google",
  "code": "authorization_code"
}

// Events sync automatically both ways
\`\`\`

#### Outlook Calendar
\`\`\`typescript
// Connect Outlook Calendar
POST /api/calendar/integrations
{
  "provider": "outlook",
  "code": "authorization_code"
}
\`\`\`

#### Features
- Two-way sync (events created in either calendar appear in both)
- Automatic token refresh
- Sync status monitoring
- Enable/disable sync per integration
- Multiple calendar support

### 4. Task Integration

Tasks from projects automatically appear in calendar:
- Task due dates create calendar events
- Task status updates sync to calendar
- Color-coded by priority
- Quick task creation from calendar

### 5. Calendar Sharing

#### iCal Feed
\`\`\`
GET /api/calendar/feed/{token}.ics
\`\`\`

Share your calendar with:
- Google Calendar (Subscribe to calendar)
- Outlook (Add calendar from URL)
- Apple Calendar (Subscribe to calendar)
- Any iCal-compatible app

#### Features
- Secure token-based access
- Filter by project or event type
- Public or private sharing
- Revokable access

### 6. Export/Import

#### Export Calendar
\`\`\`typescript
// Export as iCal
GET /api/calendar/export?format=ics

// Export as JSON
GET /api/calendar/export?format=json&projectId=xxx
\`\`\`

#### Import Calendar
\`\`\`typescript
// Import events from file
POST /api/calendar/import
Content-Type: multipart/form-data

file: calendar.ics
\`\`\`

### 7. Event Reminders

Configure multiple reminders per event:
- Notification reminders (in-app)
- Email reminders
- Custom timing (5min, 15min, 1hour, 1day, etc.)

### 8. Permissions & Access Control

#### Project Calendars
- Project members see all project events
- Non-members need explicit permission
- Admin can manage all events

#### Personal Calendars
- Private by default
- Share with specific users
- Read/write permissions

### 9. Real-time Updates

- Events sync in real-time via Ably
- Instant notifications for new events
- Automatic refresh on changes
- Collaborative editing support

## API Reference

### Events

#### Create Event
\`\`\`typescript
POST /api/calendar/events
{
  "title": "Sprint Planning",
  "description": "Q1 Sprint Planning Session",
  "type": "meeting",
  "startDate": "2024-02-15T10:00:00Z",
  "endDate": "2024-02-15T11:00:00Z",
  "location": "Conference Room A",
  "attendeeIds": ["user1", "user2"],
  "projectId": "proj123",
  "reminders": [
    { "type": "notification", "minutesBefore": 15 },
    { "type": "email", "minutesBefore": 60 }
  ]
}
\`\`\`

#### Get Events
\`\`\`typescript
GET /api/calendar/events?projectId=xxx&startDate=2024-01-01&endDate=2024-12-31
\`\`\`

#### Update Event
\`\`\`typescript
PATCH /api/calendar/events/{eventId}
{
  "title": "Updated Title",
  "startDate": "2024-02-15T14:00:00Z"
}
\`\`\`

#### Delete Event
\`\`\`typescript
DELETE /api/calendar/events/{eventId}
\`\`\`

### Integrations

#### List Integrations
\`\`\`typescript
GET /api/calendar/integrations
\`\`\`

#### Connect Integration
\`\`\`typescript
POST /api/calendar/integrations
{
  "provider": "google",
  "code": "auth_code"
}
\`\`\`

#### Update Integration
\`\`\`typescript
PATCH /api/calendar/integrations/{id}
{
  "syncEnabled": false
}
\`\`\`

#### Remove Integration
\`\`\`typescript
DELETE /api/calendar/integrations/{id}
\`\`\`

## Best Practices

1. **Use Event Types**: Properly categorize events for better organization
2. **Set Reminders**: Configure reminders for important events
3. **Sync External Calendars**: Keep all calendars in sync
4. **Share Appropriately**: Share project calendars with team members
5. **Export Regularly**: Export important calendars as backup
6. **Use Recurring Events**: Set up recurring meetings efficiently
7. **Add Locations**: Include meeting locations or video links
8. **Manage Attendees**: Keep attendee lists up to date

## Troubleshooting

### Integration Issues

**Problem**: Calendar not syncing
**Solution**: 
- Check integration status in settings
- Verify sync is enabled
- Re-authorize if token expired

**Problem**: Events not appearing
**Solution**:
- Check date filters
- Verify event permissions
- Refresh calendar view

### Performance

For optimal performance:
- Limit date range when fetching events
- Use pagination for large event lists
- Enable caching for frequently accessed calendars

## Support

For additional help:
- Check the API documentation
- Review integration examples
- Contact support team
