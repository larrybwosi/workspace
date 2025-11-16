# API Documentation

This document provides comprehensive documentation for all API endpoints in the enterprise collaboration platform.

## Authentication

All API endpoints require authentication using better-auth. Include the session cookie in requests.

### Authentication Endpoints

- `GET/POST /api/auth/*` - Better-auth endpoints for sign-in, sign-up, and session management

## Base URL

\`\`\`
http://localhost:3000/api
\`\`\`

## Response Format

All endpoints return JSON responses with the following structure:

\`\`\`json
{
  "data": {},
  "error": "Error message if applicable"
}
\`\`\`

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Tasks API

### List Tasks

\`\`\`
GET /api/tasks?projectId={projectId}
\`\`\`

Query parameters:
- `projectId` (optional) - Filter tasks by project

Response:
\`\`\`json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "status": "todo|in-progress|done",
    "priority": "low|medium|high|urgent",
    "assignees": [...],
    "subtasks": [...],
    "timeEntries": [...]
  }
]
\`\`\`

### Create Task

\`\`\`
POST /api/tasks
\`\`\`

Body:
\`\`\`json
{
  "title": "string",
  "description": "string",
  "projectId": "string",
  "status": "todo|in-progress|done",
  "priority": "low|medium|high|urgent",
  "dueDate": "ISO8601",
  "assignees": ["userId1", "userId2"],
  "tags": ["tag1", "tag2"]
}
\`\`\`

### Get Task

\`\`\`
GET /api/tasks/{taskId}
\`\`\`

### Update Task

\`\`\`
PATCH /api/tasks/{taskId}
\`\`\`

### Delete Task

\`\`\`
DELETE /api/tasks/{taskId}
\`\`\`

### Subtasks

\`\`\`
GET /api/tasks/{taskId}/subtasks
POST /api/tasks/{taskId}/subtasks
PATCH /api/tasks/{taskId}/subtasks/{subtaskId}
DELETE /api/tasks/{taskId}/subtasks/{subtaskId}
\`\`\`

### Time Entries

\`\`\`
GET /api/tasks/{taskId}/time-entries
POST /api/tasks/{taskId}/time-entries
PATCH /api/tasks/{taskId}/time-entries/{entryId}
DELETE /api/tasks/{taskId}/time-entries/{entryId}
\`\`\`

### Comments

\`\`\`
GET /api/tasks/{taskId}/comments
POST /api/tasks/{taskId}/comments
\`\`\`

### Dependencies & Blockers

\`\`\`
POST /api/tasks/{taskId}/dependencies
DELETE /api/tasks/{taskId}/dependencies?dependsOnId={taskId}
POST /api/tasks/{taskId}/blockers
DELETE /api/tasks/{taskId}/blockers?blockerId={taskId}
\`\`\`

---

## Projects API

### List Projects

\`\`\`
GET /api/projects
\`\`\`

Returns all projects where the user is a member.

### Create Project

\`\`\`
POST /api/projects
\`\`\`

Body:
\`\`\`json
{
  "name": "string",
  "icon": "string",
  "description": "string",
  "startDate": "ISO8601",
  "endDate": "ISO8601",
  "members": ["userId1", "userId2"]
}
\`\`\`

### Get Project

\`\`\`
GET /api/projects/{projectId}
\`\`\`

### Update Project

\`\`\`
PATCH /api/projects/{projectId}
\`\`\`

### Delete Project

\`\`\`
DELETE /api/projects/{projectId}
\`\`\`

### Sprints

\`\`\`
GET /api/projects/{projectId}/sprints
POST /api/projects/{projectId}/sprints
PATCH /api/projects/{projectId}/sprints/{sprintId}
DELETE /api/projects/{projectId}/sprints/{sprintId}
\`\`\`

Sprint body:
\`\`\`json
{
  "name": "string",
  "goal": "string",
  "startDate": "ISO8601",
  "endDate": "ISO8601",
  "status": "planning|active|completed"
}
\`\`\`

### Milestones

\`\`\`
GET /api/projects/{projectId}/milestones
POST /api/projects/{projectId}/milestones
\`\`\`

Milestone body:
\`\`\`json
{
  "name": "string",
  "description": "string",
  "dueDate": "ISO8601",
  "status": "pending|in-progress|completed"
}
\`\`\`

### Calendar Events

\`\`\`
GET /api/projects/{projectId}/events?startDate={date}&endDate={date}
POST /api/projects/{projectId}/events
\`\`\`

Event body:
\`\`\`json
{
  "title": "string",
  "description": "string",
  "startTime": "ISO8601",
  "endTime": "ISO8601",
  "type": "meeting|deadline|milestone|reminder",
  "color": "string",
  "attendees": ["userId1", "userId2"],
  "taskId": "string (optional)"
}
\`\`\`

---

## Notes API

### List Notes

\`\`\`
GET /api/notes?folderId={folderId}&search={query}
\`\`\`

Query parameters:
- `folderId` (optional) - Filter by folder
- `search` (optional) - Search in title and content

### Create Note

\`\`\`
POST /api/notes
\`\`\`

Body:
\`\`\`json
{
  "title": "string",
  "content": "string (markdown)",
  "folderId": "string",
  "tags": ["tag1", "tag2"],
  "linkedProjects": ["projectId1"],
  "linkedTasks": ["taskId1"],
  "collaborators": ["userId1"]
}
\`\`\`

### Get Note

\`\`\`
GET /api/notes/{noteId}
\`\`\`

### Update Note

\`\`\`
PATCH /api/notes/{noteId}
\`\`\`

### Delete Note

\`\`\`
DELETE /api/notes/{noteId}
\`\`\`

### Collaborators

\`\`\`
POST /api/notes/{noteId}/collaborators
DELETE /api/notes/{noteId}/collaborators?userId={userId}
\`\`\`

Body:
\`\`\`json
{
  "userId": "string"
}
\`\`\`

### Folders

\`\`\`
GET /api/notes/folders
POST /api/notes/folders
\`\`\`

Folder body:
\`\`\`json
{
  "name": "string",
  "icon": "string",
  "parentId": "string (optional)"
}
\`\`\`

---

## Performance Optimizations

### Caching Strategy

- Use TanStack Query for client-side caching
- Set appropriate `staleTime` and `cacheTime` values
- Implement optimistic updates for better UX

### Pagination

For large datasets, use pagination:

\`\`\`
GET /api/tasks?page=1&limit=50
\`\`\`

### Field Selection

Minimize data transfer by selecting specific fields:

\`\`\`
GET /api/tasks?fields=id,title,status
\`\`\`

### Batch Operations

Use batch endpoints to reduce network requests:

\`\`\`
POST /api/tasks/batch
\`\`\`

Body:
\`\`\`json
{
  "operations": [
    { "type": "create", "data": {...} },
    { "type": "update", "id": "taskId", "data": {...} }
  ]
}
\`\`\`

---

## Webhooks & Real-time Updates

### WebSocket Connection

Connect to WebSocket for real-time updates:

\`\`\`javascript
const ws = new WebSocket('ws://localhost:3000/api/ws')

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data)
  // Handle update
}
\`\`\`

Event types:
- `task.created`
- `task.updated`
- `task.deleted`
- `note.updated`
- `project.updated`

---

## Rate Limiting

API endpoints are rate-limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated requests

Rate limit headers:
- `X-RateLimit-Limit` - Maximum requests
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

---

## Error Handling

All errors follow this format:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
\`\`\`

Common error codes:
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Best Practices

1. **Always handle errors**: Implement proper error handling on the client
2. **Use TypeScript**: Leverage type safety for API calls
3. **Implement retries**: Use exponential backoff for failed requests
4. **Cache responses**: Use TanStack Query for efficient caching
5. **Optimize queries**: Select only needed fields and use pagination
6. **Monitor performance**: Track API response times and error rates
7. **Secure data**: Never expose sensitive data in responses
8. **Version APIs**: Use API versioning for breaking changes

---

## Support

For API support or questions, contact the development team or open an issue in the repository.
