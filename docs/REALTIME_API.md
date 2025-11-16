# Real-Time API Documentation

## Overview

This enterprise collaboration platform uses **Ably** for real-time messaging, presence, and notifications. All chat messages, project updates, and notifications are delivered instantly to connected clients.

## Setup

### Environment Variables

\`\`\`env
ABLY_API_KEY=your_ably_api_key
\`\`\`

### Authentication

Clients authenticate with Ably using token authentication. Request a token from:

\`\`\`
GET /api/auth/ably
\`\`\`

Returns a token request that can be used to initialize the Ably client.

## Real-Time Features

### 1. Chat Messages

**Channel:** `thread:{threadId}`

**Events:**
- `message:sent` - New message posted
- `message:updated` - Message edited
- `message:deleted` - Message removed
- `message:reaction` - Reaction added/removed

**Example:**
\`\`\`typescript
const channel = ably.channels.get(`thread:${threadId}`)
channel.subscribe('message:sent', (message) => {
  // Update UI with new message
})
\`\`\`

### 2. Notifications

**Channel:** `notifications:{userId}`

**Events:**
- `notification` - New notification received

**Notification Types:**
- `project_invitation` - Added to a project
- `note_shared` - Note shared with user
- `task_assigned` - Task assigned to user
- `mention` - Mentioned in a message
- `system` - System announcement

### 3. Presence

**Channel:** `presence:{channelId}`

Track who's online in a channel or project.

\`\`\`typescript
const channel = ably.channels.get(`presence:${channelId}`)
await channel.presence.enter({ status: 'online' })
\`\`\`

### 4. Typing Indicators

**Events:**
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

## API Endpoints

### Messages

\`\`\`
GET    /api/messages?threadId={id}        - Get messages
POST   /api/messages                      - Send message
PATCH  /api/messages/{id}                 - Edit message
DELETE /api/messages/{id}                 - Delete message
POST   /api/messages/{id}/reactions       - Add/remove reaction
\`\`\`

### Notifications

\`\`\`
GET    /api/notifications                 - Get all notifications
GET    /api/notifications?unreadOnly=true - Get unread only
PATCH  /api/notifications/{id}            - Mark as read
POST   /api/notifications/mark-all-read   - Mark all as read
\`\`\`

### Collaboration

\`\`\`
POST   /api/projects/{id}/members         - Add project members
POST   /api/notes/{id}/collaborators      - Share note
\`\`\`

## System Messages

System messages are automatically created for important events:

- User added to project
- Task assigned
- Note shared
- Project milestone reached

These appear as special message types in chat threads with links to relevant entities.

## Best Practices

1. **Connection Management:** Maintain a single Ably connection per user
2. **Channel Subscriptions:** Subscribe only to relevant channels
3. **Presence:** Update presence when user navigates away
4. **Error Handling:** Handle connection errors gracefully
5. **Rate Limiting:** Respect message rate limits

## Performance Optimization

- Messages are indexed by thread and timestamp
- Notifications are indexed by user and read status
- Real-time events use efficient pub/sub patterns
- Database queries use selective includes for optimal performance
