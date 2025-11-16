# AI Assistant Documentation

## Overview

The AI Assistant is an enterprise-grade conversational AI powered by Model Context Protocol (MCP) and the Vercel AI SDK. It provides secure, context-aware assistance for task management, project tracking, and workspace collaboration.

## Features

### Core Capabilities

- **Task Management**: Create, update, and query tasks across projects
- **Project Analytics**: Get insights and metrics for project health
- **Search**: Find content across messages, tasks, notes, and projects
- **Note Management**: Create and organize notes with markdown support
- **Notifications**: Send alerts and updates to team members

### Security Features

- **Authentication**: Better-auth integration with session management
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: 50 requests per minute per user
- **Audit Logging**: Complete trail of all AI interactions
- **Data Sanitization**: Automatic removal of sensitive information
- **Permission Checks**: Tool execution requires appropriate permissions

### MCP Tools Available

#### Task Tools

- `getTasks`: Query tasks with filtering
- `createTask`: Create new tasks with assignments
- `updateTask`: Modify existing tasks

#### Project Tools

- `getProjects`: List projects with status filtering
- `getProjectAnalytics`: Get detailed project metrics

#### Search Tools

- `searchContent`: Full-text search across all content types

#### Note Tools

- `getNotes`: Query notes by folder or tags
- `createNote`: Create new markdown notes

#### Utility Tools

- `sendNotification`: Send alerts to users

## API Endpoints

### POST /api/assistant/chat

Stream chat responses with tool execution.

**Request:**
\`\`\`json
{
  "message": "Create a task for database migration",
  "conversationId": "optional-conversation-id",
  "context": {}
}
\`\`\`

**Response:** Server-Sent Events (SSE) stream

### GET /api/assistant/conversations

List all user conversations.

### POST /api/assistant/conversations

Create new conversation.

### GET /api/assistant/conversations/[id]

Get conversation with full message history.

### DELETE /api/assistant/conversations/[id]

Delete a conversation.

## Security Model

### Role Permissions

- **Admin**: Full access to all resources
- **Management**: Read all, write projects/tasks, analytics
- **Development**: Read/write tasks, notes; read projects
- **Design**: Read/write tasks, notes; read projects

### Audit Logging

All assistant interactions are logged with:
- User ID and timestamp
- Action type and query
- Resource access details
- IP address and user agent
- Tool usage and results

### Rate Limiting

- 50 requests per minute per user
- 429 status code when exceeded
- Automatic reset after window expires

## Usage Examples

### Creating a Task

\`\`\`
User: "Create a high priority task for API refactoring in the Backend project, assign it to John"
