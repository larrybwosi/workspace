# API Integration Instructions

This directory contains React hooks for integrating with the backend API using TanStack Query (React Query) and Axios.

## Setup

### 1. Install Dependencies

\`\`\`bash
npm install @tanstack/react-query axios
# or
yarn add @tanstack/react-query axios
\`\`\`

### 2. Configure Query Client

Add the QueryClientProvider to your root layout:

\`\`\`tsx
// app/layout.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  )
}
\`\`\`

### 3. Configure Environment Variables

Create a `.env.local` file:

\`\`\`env
NEXT_PUBLIC_API_URL=https://api.yourapp.com
\`\`\`

## Usage Examples

### Channels

\`\`\`tsx
import { useChannels, useCreateChannel, useUpdateChannel } from '@/hooks/api/use-channels'

function ChannelList() {
  const { data: channels, isLoading } = useChannels()
  const createChannel = useCreateChannel()
  
  const handleCreate = async () => {
    await createChannel.mutateAsync({
      name: 'New Channel',
      icon: '📢',
      type: 'channel',
    })
  }
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {channels?.map(channel => (
        <div key={channel.id}>{channel.name}</div>
      ))}
      <button onClick={handleCreate}>Create Channel</button>
    </div>
  )
}
\`\`\`

### Messages

\`\`\`tsx
import { useMessages, useSendMessage } from '@/hooks/api/use-messages'

function MessageList({ channelId }: { channelId: string }) {
  const { data, fetchNextPage, hasNextPage } = useMessages(channelId)
  const sendMessage = useSendMessage()
  
  const handleSend = async (content: string) => {
    await sendMessage.mutateAsync({
      channelId,
      userId: 'current-user-id',
      content,
      reactions: [],
      mentions: [],
    })
  }
  
  return (
    <div>
      {data?.pages.map(page => 
        page.messages.map(message => (
          <div key={message.id}>{message.content}</div>
        ))
      )}
      {hasNextPage && <button onClick={() => fetchNextPage()}>Load More</button>}
    </div>
  )
}
\`\`\`

### Tasks

\`\`\`tsx
import { useTasks, useCreateTask, useMoveTask } from '@/hooks/api/use-tasks'

function TaskBoard({ projectId }: { projectId: string }) {
  const { data: tasks } = useTasks(projectId)
  const createTask = useCreateTask()
  const moveTask = useMoveTask()
  
  const handleCreateTask = async () => {
    await createTask.mutateAsync({
      projectId,
      title: 'New Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignees: [],
      dueDate: new Date(),
      linkedChannels: [],
      linkedMessages: [],
      comments: 0,
      links: 0,
      progress: { completed: 0, total: 0 },
    })
  }
  
  const handleMoveTask = async (taskId: string, status: 'todo' | 'in-progress' | 'done') => {
    await moveTask.mutateAsync({ id: taskId, projectId, status })
  }
  
  return (
    <div>
      {tasks?.map(task => (
        <div key={task.id}>
          {task.title}
          <button onClick={() => handleMoveTask(task.id, 'in-progress')}>
            Move to In Progress
          </button>
        </div>
      ))}
      <button onClick={handleCreateTask}>Create Task</button>
    </div>
  )
}
\`\`\`

### Reactions (with Optimistic Updates)

\`\`\`tsx
import { useAddReaction, useRemoveReaction } from '@/hooks/api/use-reactions'

function MessageReactions({ messageId, channelId }: { messageId: string; channelId: string }) {
  const addReaction = useAddReaction()
  
  const handleReaction = async (emoji: string) => {
    // This will update the UI immediately before the API call completes
    await addReaction.mutateAsync({ messageId, emoji, channelId })
  }
  
  return (
    <button onClick={() => handleReaction('👍')}>
      👍 Like
    </button>
  )
}
\`\`\`

### File Upload

\`\`\`tsx
import { useUploadFile } from '@/hooks/api/use-files'

function FileUploader({ taskId }: { taskId: string }) {
  const uploadFile = useUploadFile()
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    await uploadFile.mutateAsync({
      file,
      entityType: 'task',
      entityId: taskId,
    })
  }
  
  return <input type="file" onChange={handleUpload} />
}
\`\`\`

### Search

\`\`\`tsx
import { useSearch } from '@/hooks/api/use-search'
import { useState } from 'react'

function SearchBar() {
  const [query, setQuery] = useState('')
  const { data: results, isLoading } = useSearch(query)
  
  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {isLoading && <div>Searching...</div>}
      {results?.map(result => (
        <div key={result.id}>{result.title}</div>
      ))}
    </div>
  )
}
\`\`\`

## API Endpoints

The hooks expect the following API endpoints:

### Channels
- `GET /channels` - List all channels
- `GET /channels/:id` - Get channel details
- `POST /channels` - Create channel
- `PATCH /channels/:id` - Update channel
- `DELETE /channels/:id` - Delete channel
- `POST /channels/:id/join` - Join channel
- `POST /channels/:id/leave` - Leave channel

### Messages
- `GET /channels/:channelId/messages` - List messages (with pagination)
- `POST /channels/:channelId/messages` - Send message
- `PATCH /messages/:id` - Update message
- `DELETE /messages/:id` - Delete message
- `POST /messages/:id/replies` - Reply to message
- `POST /messages/:id/reactions` - Add reaction
- `DELETE /messages/:id/reactions/:emoji` - Remove reaction

### Tasks
- `GET /projects/:projectId/tasks` - List tasks
- `GET /tasks/:id` - Get task details
- `POST /projects/:projectId/tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `PATCH /tasks/:id/move` - Move task (change status)
- `POST /tasks/:id/duplicate` - Duplicate task

### Projects
- `GET /projects` - List all projects
- `GET /projects/:id` - Get project details
- `POST /projects` - Create project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Users
- `GET /users` - List all users
- `GET /users/me` - Get current user
- `GET /users/:id` - Get user details
- `PATCH /users/:id` - Update user
- `PATCH /users/me/status` - Update user status

### Comments
- `GET /tasks/:taskId/comments` - List task comments
- `GET /messages/:messageId/comments` - List message comments
- `POST /tasks/:taskId/comments` - Add task comment
- `POST /messages/:messageId/comments` - Add message comment
- `DELETE /comments/:id` - Delete comment

### Files
- `POST /files/upload` - Upload file
- `DELETE /files/:id` - Delete file

### Search
- `GET /search?q=query` - Search all content
- `GET /search/advanced?q=query&type=...&channel=...` - Advanced search

## Authentication

The API client automatically includes the authentication token from localStorage in all requests. Set the token after login:

\`\`\`tsx
localStorage.setItem('auth_token', 'your-jwt-token')
\`\`\`

The token will be automatically included in the `Authorization` header as `Bearer <token>`.

## Error Handling

All hooks handle errors automatically. You can access error states:

\`\`\`tsx
const { data, error, isError } = useChannels()

if (isError) {
  return <div>Error: {error.message}</div>
}
\`\`\`

## Cache Management

TanStack Query automatically manages caching. You can manually invalidate caches:

\`\`\`tsx
import { useQueryClient } from '@tanstack/react-query'
import { channelKeys } from '@/hooks/api/use-channels'

function MyComponent() {
  const queryClient = useQueryClient()
  
  const refreshChannels = () => {
    queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
  }
  
  return <button onClick={refreshChannels}>Refresh</button>
}
\`\`\`

## Optimistic Updates

Some mutations (like reactions and task moves) include optimistic updates for instant UI feedback. The UI updates immediately, and if the API call fails, it automatically rolls back.

## Development Tools

Install React Query Devtools for debugging:

\`\`\`tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Add to your layout
<ReactQueryDevtools initialIsOpen={false} />
\`\`\`

This provides a visual interface to inspect queries, mutations, and cache state.
