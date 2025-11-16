# API Integration Guide

Comprehensive guide for integrating with the backend API using TanStack Query and Axios.

## Table of Contents

- [Setup](#setup)
- [Authentication](#authentication)
- [Available Hooks](#available-hooks)
- [Usage Examples](#usage-examples)
- [API Endpoints](#api-endpoints)
- [Best Practices](#best-practices)
- [Error Handling](#error-handling)
- [Cache Management](#cache-management)

## Setup

### 1. Install Dependencies

\`\`\`bash
npm install @tanstack/react-query axios
\`\`\`

### 2. Configure Environment Variables

Create `.env.local`:

\`\`\`env
NEXT_PUBLIC_API_URL=https://api.yourapp.com
\`\`\`

### 3. Query Client Setup

The QueryClientProvider is already configured in `app/layout.tsx`.

## Authentication

The API client automatically includes authentication tokens from localStorage:

\`\`\`typescript
localStorage.setItem('auth_token', 'your-jwt-token')
\`\`\`

## Available Hooks

### Projects

- `useProjects()` - Fetch all projects
- `useProject(id)` - Fetch single project
- `useCreateProject()` - Create new project
- `useUpdateProject()` - Update project
- `useDeleteProject()` - Delete project
- `useProjectMilestones(projectId)` - Fetch project milestones
- `useProjectRisks(projectId)` - Fetch project risks
- `useProjectBudget(projectId)` - Fetch project budget
- `useProjectResources(projectId)` - Fetch project resources
- `useUpdateMilestone()` - Update milestone
- `useCreateRisk()` - Create risk
- `useUpdateBudget()` - Update budget

### Notes

- `useNotes(folderId?)` - Fetch all notes (optionally filtered by folder)
- `useNote(noteId)` - Fetch single note
- `useCreateNote()` - Create new note
- `useUpdateNote()` - Update note (with optimistic updates)
- `useDeleteNote()` - Delete note
- `useSearchNotes(query)` - Search notes
- `useNoteBacklinks(noteId)` - Get note backlinks
- `useNoteFolders()` - Fetch note folders
- `useCreateNoteFolder()` - Create note folder
- `useShareNote()` - Share note with users
- `useToggleFavoriteNote()` - Toggle favorite status
- `useDuplicateNote()` - Duplicate note
- `useMoveNoteToFolder()` - Move note to folder
- `useRenameNoteFolder()` - Rename folder
- `useDeleteNoteFolder()` - Delete folder
- `useAddNoteCollaborator()` - Add collaborator to note
- `useRemoveNoteCollaborator()` - Remove collaborator from note

### Other Entities

See `instructions.md` for hooks related to:
- Channels
- Messages
- Tasks
- Users
- Comments
- Files
- Reactions
- Search

## Usage Examples

### Creating a Project

\`\`\`typescript
import { useCreateProject } from '@/hooks/api/use-projects'

function CreateProjectButton() {
  const createProject = useCreateProject()
  
  const handleCreate = async () => {
    try {
      await createProject.mutateAsync({
        name: 'New Project',
        description: 'Project description',
        status: 'active',
        tasks: [],
        members: [],
        startDate: new Date(),
        icon: '📋'
      })
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }
  
  return (
    <button onClick={handleCreate} disabled={createProject.isPending}>
      {createProject.isPending ? 'Creating...' : 'Create Project'}
    </button>
  )
}
\`\`\`

### Managing Notes with Optimistic Updates

\`\`\`typescript
import { useUpdateNote } from '@/hooks/api/use-notes'

function NoteEditor({ noteId }: { noteId: string }) {
  const updateNote = useUpdateNote()
  
  const handleSave = async (content: string) => {
    // UI updates immediately, rolls back on error
    await updateNote.mutateAsync({
      noteId,
      data: {
        content,
        lastModified: new Date()
      }
    })
  }
  
  return (
    <textarea 
      onChange={(e) => handleSave(e.target.value)}
      placeholder="Start typing..."
    />
  )
}
\`\`\`

### Searching Notes

\`\`\`typescript
import { useSearchNotes } from '@/hooks/api/use-notes'
import { useState } from 'react'

function NoteSearch() {
  const [query, setQuery] = useState('')
  const { data: results, isLoading } = useSearchNotes(query)
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes..."
      />
      {isLoading && <div>Searching...</div>}
      {results?.map(note => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  )
}
\`\`\`

## API Endpoints

### Projects

- `GET /projects` - List projects
- `GET /projects/:id` - Get project
- `POST /projects` - Create project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/:id/milestones` - Get milestones
- `PATCH /projects/:id/milestones/:milestoneId` - Update milestone
- `GET /projects/:id/risks` - Get risks
- `POST /projects/:id/risks` - Create risk
- `GET /projects/:id/budget` - Get budget
- `PATCH /projects/:id/budget` - Update budget
- `GET /projects/:id/resources` - Get resources

### Notes

- `GET /notes` - List notes
- `GET /notes/:id` - Get note
- `POST /notes` - Create note
- `PATCH /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note
- `GET /notes/search?q=query` - Search notes
- `GET /notes/:id/backlinks` - Get backlinks
- `GET /notes/folders` - List folders
- `POST /notes/folders` - Create folder
- `PATCH /notes/folders/:id` - Update folder
- `DELETE /notes/folders/:id` - Delete folder
- `POST /notes/:id/favorite` - Toggle favorite
- `POST /notes/:id/duplicate` - Duplicate note
- `PATCH /notes/:id/move` - Move to folder
- `POST /notes/:id/share` - Share note
- `POST /notes/:id/collaborators` - Add collaborator
- `DELETE /notes/:id/collaborators/:userId` - Remove collaborator

## Best Practices

### 1. Use Query Keys Consistently

\`\`\`typescript
// Good - uses predefined keys
const { data } = useNotes()

// Bad - manual query key
const { data } = useQuery({ queryKey: ['notes'] })
\`\`\`

### 2. Handle Loading and Error States

\`\`\`typescript
const { data, isLoading, error } = useNotes()

if (isLoading) return <Spinner />
if (error) return <ErrorMessage error={error} />
return <NotesList notes={data} />
\`\`\`

### 3. Leverage Optimistic Updates

\`\`\`typescript
// Mutations with optimistic updates provide instant feedback
const updateNote = useUpdateNote() // Already includes optimistic updates
\`\`\`

### 4. Invalidate Related Queries

\`\`\`typescript
// The hooks automatically invalidate related queries
// No manual invalidation needed in most cases
\`\`\`

## Error Handling

All hooks handle errors automatically. Access error states:

\`\`\`typescript
const { data, error, isError } = useNotes()

if (isError) {
  console.error('Error fetching notes:', error.message)
  return <ErrorDisplay error={error} />
}
\`\`\`

## Cache Management

### Automatic Caching

TanStack Query caches data automatically with sensible defaults:

- `staleTime`: 60 seconds
- `refetchOnWindowFocus`: false

### Manual Cache Invalidation

\`\`\`typescript
import { useQueryClient } from '@tanstack/react-query'

function RefreshButton() {
  const queryClient = useQueryClient()
  
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] })
  }
  
  return <button onClick={handleRefresh}>Refresh</button>
}
\`\`\`

### Query Keys Reference

\`\`\`typescript
// Projects
projectKeys.all          // ['projects']
projectKeys.lists()      // ['projects', 'list']
projectKeys.detail(id)   // ['projects', 'detail', id]

// Notes
['notes']                // All notes
['notes', folderId]      // Notes in folder
['notes', noteId]        // Single note
['note-folders']         // All folders
\`\`\`

## Development Tools

React Query Devtools are enabled in development mode. Access them via the floating icon in the bottom-right corner of your app.

## Support

For issues or questions:
1. Check the TanStack Query documentation
2. Review existing hook implementations
3. Contact the development team
