# API Integration Guide

This document provides comprehensive documentation for integrating with the backend API endpoints.

## Authentication

All API endpoints require authentication using Better Auth. Include the session cookie in requests.

### Setup Authentication

\`\`\`typescript
import { authClient } from "@/lib/auth-client"

// Sign in
await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
})

// Get current session
const { data: session } = authClient.useSession()
\`\`\`

## Base URL

\`\`\`
Development: http://localhost:3000/api
Production: https://your-domain.com/api
\`\`\`

## Channels API

### Get All Channels
\`\`\`
GET /api/channels
\`\`\`

### Get Channel by ID
\`\`\`
GET /api/channels/:channelId
\`\`\`

### Create Channel
\`\`\`
POST /api/channels
Content-Type: application/json

{
  "name": "New Channel",
  "icon": "🔥",
  "type": "channel",
  "description": "Channel description",
  "isPrivate": false,
  "parentId": "parent-id",
  "members": ["user-id-1", "user-id-2"]
}
\`\`\`

### Update Channel
\`\`\`
PATCH /api/channels/:channelId
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
\`\`\`

### Delete Channel
\`\`\`
DELETE /api/channels/:channelId
\`\`\`

## Messages API

### Get Messages
\`\`\`
GET /api/messages?threadId=thread-id
\`\`\`

### Create Message
\`\`\`
POST /api/messages
Content-Type: application/json

{
  "threadId": "thread-id",
  "content": "Message content",
  "messageType": "standard",
  "metadata": {},
  "replyToId": "message-id",
  "mentions": ["@user"],
  "attachments": [
    {
      "name": "file.pdf",
      "type": "application/pdf",
      "url": "https://...",
      "size": "1.2 MB"
    }
  ]
}
\`\`\`

## Projects API

### Get All Projects
\`\`\`
GET /api/projects
\`\`\`

### Get Project by ID
\`\`\`
GET /api/projects/:projectId
\`\`\`

### Create Project
\`\`\`
POST /api/projects
Content-Type: application/json

{
  "name": "Project Name",
  "icon": "📁",
  "description": "Project description",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "members": ["user-id-1", "user-id-2"],
  "channels": ["channel-id-1"]
}
\`\`\`

## Tasks API

### Get Tasks
\`\`\`
GET /api/tasks?projectId=project-id
\`\`\`

### Create Task
\`\`\`
POST /api/tasks
Content-Type: application/json

{
  "title": "Task title",
  "description": "Task description",
  "projectId": "project-id",
  "status": "todo",
  "priority": "high",
  "dueDate": "2024-12-31",
  "estimatedHours": 8,
  "assignees": ["user-id-1"],
  "tags": ["frontend", "urgent"],
  "sprintId": "sprint-id",
  "parentTaskId": "parent-task-id"
}
\`\`\`

## Notes API

### Get Notes
\`\`\`
GET /api/notes?folderId=folder-id&search=query
\`\`\`

### Create Note
\`\`\`
POST /api/notes
Content-Type: application/json

{
  "title": "Note title",
  "content": "Note content in markdown",
  "folderId": "folder-id",
  "tags": ["tag1", "tag2"],
  "linkedProjects": ["project-id"],
  "linkedTasks": ["task-id"],
  "collaborators": ["user-id"]
}
\`\`\`

## Error Responses

All endpoints return consistent error responses:

\`\`\`json
{
  "error": "Error message description"
}
\`\`\`

### Status Codes
- \`200\` - Success
- \`201\` - Created
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`404\` - Not Found
- \`500\` - Internal Server Error

## Database Setup

### 1. Install Dependencies
\`\`\`bash
npm install @prisma/client
npm install -D prisma
\`\`\`

### 2. Set Environment Variables
\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/database"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

### 3. Generate Prisma Client
\`\`\`bash
npx prisma generate
\`\`\`

### 4. Run Migrations
\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

### 5. Seed Database (Optional)
\`\`\`bash
npx prisma db seed
\`\`\`

## Best Practices

1. **Always handle errors** - Wrap API calls in try-catch blocks
2. **Use TypeScript types** - Import types from Prisma Client
3. **Implement optimistic updates** - Update UI before API response
4. **Cache with TanStack Query** - Leverage automatic caching and invalidation
5. **Validate input** - Use Zod or similar for request validation
6. **Rate limiting** - Implement rate limiting for production
7. **Pagination** - Add pagination for large datasets

## Example: Complete Integration

\`\`\`typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

// Fetch projects
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await axios.get("/api/projects")
      return data
    },
  })
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newProject) => {
      const { data } = await axios.post("/api/projects", newProject)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
\`\`\`
