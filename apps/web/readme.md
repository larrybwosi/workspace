# Enterprise Communication Platform - External API Documentation

## Overview

This platform provides a comprehensive API for external applications to post messages, notifications, and updates to channels. The API supports enterprise features including authentication, rate limiting, webhooks, and rich message formatting.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
- [Message Types](#message-types)
- [Rich Embeds](#rich-embeds)
- [Webhooks](#webhooks)
- [Error Handling](#error-handling)
- [SDK Examples](#sdk-examples)
- [Best Practices](#best-practices)

---

## Authentication

All API requests require authentication using an API key. Generate API keys from the [Integrations](/integrations) page.

### API Key Header

Include your API key in the `X-API-Key` header:

\`\`\`bash
curl -X POST https://your-domain.com/api/external/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_your_api_key_here" \
  -d '{"channelId": "channel_id", "content": "Hello from external app!"}'
\`\`\`

### Permissions

API keys can have the following permissions:

| Permission | Description |
|------------|-------------|
| `messages:read` | Read messages from channels |
| `messages:write` | Post messages to channels |
| `channels:read` | List accessible channels |
| `tasks:read` | Read tasks from projects |
| `tasks:write` | Create and update tasks |
| `projects:read` | Read project information |
| `*` | Full access (all permissions) |

---

## Rate Limiting

API requests are rate-limited to protect the platform and ensure fair usage.

### Default Limits

- **Standard API Keys**: 1,000 requests per hour
- **Enterprise API Keys**: 10,000 requests per hour

### Rate Limit Headers

Every response includes rate limit information:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds to wait (only when rate limited) |

### Rate Limit Exceeded Response

\`\`\`json
{
  "error": "Too Many Requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Retry after 3600 seconds.",
  "retryAfter": 3600
}
\`\`\`

---

## Endpoints

### List Channels

\`\`\`
GET /api/external/channels
\`\`\`

**Query Parameters:**
- `workspaceId` (optional): Filter by workspace

**Response:**
\`\`\`json
{
  "channels": [
    {
      "id": "clx123abc",
      "name": "general",
      "icon": "#",
      "type": "channel",
      "description": "General discussion",
      "isPrivate": false,
      "workspaceId": "workspace_id",
      "memberCount": 25,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
\`\`\`

---

### Send Message

\`\`\`
POST /api/external/messages
\`\`\`

**Request Body:**
\`\`\`json
{
  "channelId": "clx123abc",
  "content": "Deployment completed successfully! :rocket:",
  "messageType": "integration",
  "source": {
    "name": "GitHub Actions",
    "icon": "https://github.githubassets.com/favicon.ico",
    "url": "https://github.com/org/repo/actions"
  },
  "embeds": [
    {
      "title": "Build #1234",
      "description": "All tests passed",
      "color": "#22c55e",
      "fields": [
        { "name": "Branch", "value": "main", "inline": true },
        { "name": "Duration", "value": "2m 34s", "inline": true }
      ],
      "footer": "GitHub Actions",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "priority": "normal",
  "silent": false
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "msg_abc123",
    "channelId": "clx123abc",
    "threadId": "thread_xyz789",
    "content": "Deployment completed successfully! :rocket:",
    "messageType": "integration",
    "timestamp": "2024-01-15T10:30:00Z",
    "metadata": {
      "external": true,
      "source": { "name": "GitHub Actions" }
    }
  }
}
\`\`\`

---

### Send Message to Specific Channel

\`\`\`
POST /api/external/channels/{channelId}/messages
\`\`\`

Same request body as above, without the `channelId` field.

---

### Get Channel Messages

\`\`\`
GET /api/external/channels/{channelId}/messages
\`\`\`

**Query Parameters:**
- `limit` (optional, default: 50, max: 100): Number of messages to return
- `cursor` (optional): Pagination cursor
- `before` (optional): Get messages before this timestamp
- `after` (optional): Get messages after this timestamp

**Response:**
\`\`\`json
{
  "messages": [
    {
      "id": "msg_abc123",
      "content": "Hello world!",
      "messageType": "standard",
      "timestamp": "2024-01-15T10:30:00Z",
      "user": {
        "id": "user_123",
        "name": "John Doe",
        "image": "https://..."
      },
      "attachments": [],
      "reactions": []
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "2024-01-15T10:25:00Z",
    "limit": 50
  }
}
\`\`\`

---

### Batch Send Messages

\`\`\`
PUT /api/external/messages
\`\`\`

Send up to 100 messages in a single request.

**Request Body:**
\`\`\`json
{
  "messages": [
    { "channelId": "ch1", "content": "Message 1" },
    { "channelId": "ch2", "content": "Message 2" }
  ]
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "results": [
    { "index": 0, "data": { "id": "msg_1", ... } },
    { "index": 1, "data": { "id": "msg_2", ... } }
  ],
  "errors": [],
  "summary": {
    "total": 2,
    "succeeded": 2,
    "failed": 0
  }
}
\`\`\`

---

## Message Types

| Type | Description | Use Case |
|------|-------------|----------|
| `standard` | Regular user message | General communication |
| `system` | System notification | Platform events |
| `bot` | Automated bot message | Chatbots, auto-responders |
| `integration` | External integration | CI/CD, monitoring, etc. |
| `alert` | Important alert | Critical notifications |
| `announcement` | Announcement | Company-wide updates |

---

## Rich Embeds

Embeds allow you to send rich, formatted content similar to Discord/Slack.

### Embed Structure

\`\`\`json
{
  "title": "Build Status",
  "description": "Build completed successfully",
  "url": "https://ci.example.com/build/123",
  "color": "#22c55e",
  "thumbnail": "https://example.com/logo.png",
  "fields": [
    { "name": "Status", "value": "Success", "inline": true },
    { "name": "Duration", "value": "2m 34s", "inline": true },
    { "name": "Commit", "value": "abc123", "inline": false }
  ],
  "footer": "CI/CD Pipeline",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

### Priority Levels

| Priority | Color | Description |
|----------|-------|-------------|
| `low` | Gray | Informational messages |
| `normal` | Blue | Standard notifications |
| `high` | Orange | Important updates |
| `urgent` | Red | Critical alerts |

---

## Webhooks

Configure outgoing webhooks to receive notifications when events occur.

### Supported Events

- `message.created` - New message posted
- `message.updated` - Message edited
- `message.deleted` - Message removed
- `task.created` - New task created
- `task.updated` - Task modified
- `task.completed` - Task marked complete
- `project.created` - New project created
- `member.joined` - User joined channel

### Webhook Payload

\`\`\`json
{
  "event": "message.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "message": {
      "id": "msg_123",
      "content": "Hello!",
      "channelId": "ch_456"
    },
    "source": "external_api"
  }
}
\`\`\`

### Webhook Signature

All webhooks are signed using HMAC-SHA256. Verify the signature:

\`\`\`javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
\`\`\`

---

## Error Handling

### Error Response Format

\`\`\`json
{
  "error": "Error Type",
  "code": "ERROR_CODE",
  "message": "Human-readable description",
  "details": []
}
\`\`\`

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_API_KEY` | 401 | API key missing or invalid |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing required permission |
| `CHANNEL_NOT_FOUND` | 404 | Channel does not exist |
| `INVALID_REQUEST_BODY` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## SDK Examples

### Node.js / TypeScript

\`\`\`typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://your-domain.com/api/external',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.API_KEY,
  },
});

// Send a message
async function sendMessage(channelId: string, content: string) {
  const response = await client.post('/messages', {
    channelId,
    content,
    source: {
      name: 'My App',
      icon: 'https://myapp.com/icon.png',
    },
  });
  return response.data;
}

// Send with embed
async function sendAlert(channelId: string) {
  await client.post('/messages', {
    channelId,
    content: 'Server Alert!',
    messageType: 'alert',
    priority: 'high',
    embeds: [{
      title: 'CPU Usage Critical',
      description: 'Server cpu-1 is at 95% usage',
      color: '#ef4444',
      fields: [
        { name: 'Server', value: 'cpu-1', inline: true },
        { name: 'Usage', value: '95%', inline: true },
      ],
    }],
  });
}
\`\`\`

### Python

\`\`\`python
import requests
import os

API_KEY = os.environ.get('API_KEY')
BASE_URL = 'https://your-domain.com/api/external'

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
}

def send_message(channel_id: str, content: str):
    response = requests.post(
        f'{BASE_URL}/messages',
        headers=headers,
        json={
            'channelId': channel_id,
            'content': content,
            'source': {
                'name': 'Python Bot',
            },
        },
    )
    return response.json()

# GitHub Action example
def notify_deployment(channel_id: str, repo: str, status: str):
    color = '#22c55e' if status == 'success' else '#ef4444'
    
    requests.post(
        f'{BASE_URL}/messages',
        headers=headers,
        json={
            'channelId': channel_id,
            'content': f'Deployment {status}!',
            'messageType': 'integration',
            'embeds': [{
                'title': f'Deploy: {repo}',
                'color': color,
                'fields': [
                    {'name': 'Status', 'value': status, 'inline': True},
                ],
            }],
        },
    )
\`\`\`

### cURL

\`\`\`bash
# Simple message
curl -X POST https://your-domain.com/api/external/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_your_key" \
  -d '{
    "channelId": "clx123abc",
    "content": "Hello from cURL!"
  }'

# With embed
curl -X POST https://your-domain.com/api/external/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_your_key" \
  -d '{
    "channelId": "clx123abc",
    "content": "Build completed",
    "messageType": "integration",
    "embeds": [{
      "title": "Build #123",
      "color": "#22c55e",
      "fields": [
        {"name": "Status", "value": "Success", "inline": true}
      ]
    }]
  }'
\`\`\`

---

## Best Practices

### 1. Handle Rate Limits Gracefully

\`\`\`typescript
async function sendWithRetry(message: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.post('/messages', message);
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60;
        await new Promise(r => setTimeout(r, retryAfter * 1000));
      } else {
        throw error;
      }
    }
  }
}
\`\`\`

### 2. Use Batch Endpoints

For multiple messages, use the batch endpoint to reduce API calls:

\`\`\`typescript
// Instead of:
for (const msg of messages) {
  await client.post('/messages', msg);
}

// Use:
await client.put('/messages', { messages });
\`\`\`

### 3. Set Appropriate Priorities

Use `silent: true` for non-urgent notifications to avoid disturbing users.

### 4. Include Source Information

Always include `source` to help users identify message origins.

### 5. Validate Webhooks

Always verify webhook signatures before processing.

---

## Support

- Email: support@your-domain.com
- Documentation: https://docs.your-domain.com
- Status Page: https://status.your-domain.com

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Message posting with embeds
- Batch message support
- Rate limiting
- Webhook integration
\`\`\`
