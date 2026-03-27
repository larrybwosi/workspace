"use client"

export const docs = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Quick introduction to the platform and key features",
    content: `# Getting Started

Welcome to the enterprise collaboration platform! This guide will help you get started quickly.

## Creating Your First Project

1. Navigate to the Projects section
2. Click "Create Project"
3. Add project name, description, and team members
4. Set up your first sprint or milestone

## Key Features

- **Real-time Collaboration**: Chat, share files, and communicate instantly
- **Task Management**: Kanban, list views, and Gantt charts
- **Notes & Documentation**: Rich markdown editor with linking
- **Time Tracking**: Monitor project hours and capacity
- **Notifications**: Stay updated with alerts and mentions

## Next Steps

- [API Integration](../docs/api-integration) - Integrate with external systems
- [Invitations](../docs/invitation-system) - Invite team members
- [Cron Jobs](../docs/cron-jobs) - Set up automated tasks
`,
  },
  {
    slug: "api-integration",
    title: "API Integration",
    description: "Complete guide for integrating with the backend API using TanStack Query",
    content: `# API Integration Guide

Comprehensive guide for integrating with the backend API using TanStack Query and Axios.

## Setup

### 1. Install Dependencies

\`\`\`bash
npm install @tanstack/react-query axios
\`\`\`

### 2. Configure Environment Variables

Create \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_API_URL=https://api.yourapp.com
\`\`\`

## Authentication

The API client automatically includes authentication tokens from localStorage.

## Available Hooks

### Projects
- \`useProjects()\` - Fetch all projects
- \`useProject(id)\` - Fetch single project
- \`useCreateProject()\` - Create new project
- \`useUpdateProject()\` - Update project

### Notes
- \`useNotes()\` - Fetch all notes
- \`useCreateNote()\` - Create new note
- \`useUpdateNote()\` - Update note
- \`useDeleteNote()\` - Delete note

## Best Practices

1. Always handle loading and error states
2. Use optimistic updates for better UX
3. Leverage automatic cache invalidation
4. Monitor rate limits

## Example

\`\`\`typescript
import { useProjects } from '@/hooks/api/use-projects'

export function ProjectsList() {
  const { data, isLoading, error } = useProjects()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading projects</div>
  
  return (
    <div>
      {data?.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  )
}
\`\`\`
`,
  },
  {
    slug: "integrations",
    title: "External Integrations",
    description: "Guide for integrating external systems like ERP, CRM, and CI/CD",
    content: `# External Integrations Guide

Complete guide for integrating external systems with the collaboration platform.

## Overview

The platform supports:
- API Keys for authenticated access
- Webhooks for real-time events
- System Messages for posting updates
- Custom Message UI Definitions for rich interactions

## Creating an API Key

1. Navigate to Settings → Integrations → API Keys
2. Click "Create API Key"
3. Select permissions and save

## Sending Messages

### Basic Message

\`\`\`bash
curl -X POST https://api.yourapp.com/api/integrations/messages \\
  -H "X-API-Key: sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "threadId": "channel-123",
    "title": "Update",
    "message": "Your message here",
    "icon": "📦"
  }'
\`\`\`

### Custom Message with UI

\`\`\`bash
curl -X POST https://api.yourapp.com/api/integrations/custom-messages \\
  -H "X-API-Key: sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "definition": {
      "title": "Approval Request",
      "type": "approval",
      "components": [...]
    },
    "targetChannelId": "channel-123"
  }'
\`\`\`

## Webhook Events

Available events:
- \`task.created\`
- \`task.completed\`
- \`project.updated\`
- \`message.sent\`
- \`note.shared\`

## Examples

### ERP Integration
Post purchase order approvals to channels for team review.

### CI/CD Integration
Send deployment status updates with real-time progress.

### CRM Integration
Alert teams about new leads and opportunities.
`,
  },
  {
    slug: "invitation-system",
    title: "Invitation System",
    description: "Invite team members with SEO-optimized invitation pages",
    content: `# Invitation System Documentation

## Overview

The invitation system allows existing users to invite new team members to join the platform.

## Features

- Email-based invitations with secure tokens
- 7-day expiration period
- Project-specific invitations
- SEO-optimized invitation pages
- Beautiful acceptance flow

## Creating an Invitation

### API Endpoint

\`\`\`
POST /api/invitations
\`\`\`

\`\`\`json
{
  "email": "newuser@example.com",
  "role": "member",
  "projectId": "project_123"
}
\`\`\`

### Using React Hook

\`\`\`typescript
import { useCreateInvitation } from '@/hooks/api/use-invitations'

function InviteButton() {
  const createInvitation = useCreateInvitation()

  const handleInvite = async () => {
    const result = await createInvitation.mutateAsync({
      email: 'colleague@example.com',
      projectId: 'project_123'
    })
    
    console.log('Invitation link:', result.invitationLink)
  }

  return <button onClick={handleInvite}>Invite User</button>
}
\`\`\`

## SEO Optimization

Invitation pages include:
- Open Graph meta tags for social sharing
- Twitter Card support
- Mobile-responsive design
- Canonical URLs

## Security

- Secure token generation
- Token expiration (7 days)
- One-time use tokens
- Email verification
- Rate limiting
`,
  },
  {
    slug: "cron-jobs",
    title: "Cron Jobs & Automation",
    description: "Set up automated tasks for notifications, reminders, and project management",
    content: `# Cron Jobs & Automation Guide

## Overview

Automated tasks that run on a schedule to manage notifications, reminders, and project operations.

## Available Cron Jobs

### Task Management
- Check for due tasks
- Update overdue items
- Monitor sprint progress
- Track milestone completion

### Notifications
- Send task reminders
- Notify project managers
- Alert on deadline approaches
- Update team on sprint status

### Maintenance
- Clean up expired data
- Archive completed projects
- Generate reports
- Optimize database

## Configuring Cron Jobs

### Bearer Token Authentication

All cron endpoints require a valid bearer token:

\`\`\`bash
curl -X POST https://api.yourapp.com/api/cron/tasks \\
  -H "Authorization: Bearer your_cron_token"
\`\`\`

### Setting Up Scheduled Execution

#### Using GitHub Actions

\`\`\`yaml
name: Run Cron Jobs
on:
  schedule:
    - cron: '0 * * * *'  # Hourly

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Run task checks
        run: |
          curl -X POST https://api.yourapp.com/api/cron/tasks \\
            -H "Authorization: Bearer \${{ secrets.CRON_TOKEN }}"
\`\`\`

#### Using Vercel Cron

Add to \`vercel.json\`:

\`\`\`json
{
  "crons": [{
    "path": "/api/cron/tasks",
    "schedule": "0 * * * *"
  }]
}
\`\`\`

## Cron Jobs API

### Task Alerts

\`\`\`
POST /api/cron/tasks
\`\`\`

Checks and sends notifications for:
- Due tasks
- Overdue items
- Approaching deadlines
- Sprint completions

### Response

\`\`\`json
{
  "processed": 156,
  "notificationsSent": 42,
  "errors": 0,
  "duration": "2.3s"
}
\`\`\`

## System Messages for Alerts

The system sends different message types:

### Task Due Alert

\`\`\`json
{
  "type": "task_due",
  "title": "Task Due Today",
  "message": "Review Database Performance - due in 2 hours",
  "priority": "high"
}
\`\`\`

### Sprint Ending Alert

\`\`\`json
{
  "type": "sprint_ending",
  "title": "Sprint Ending Soon",
  "message": "Sprint 5 ends in 1 day with 3 incomplete tasks",
  "priority": "high"
}
\`\`\`

### Milestone Completion

\`\`\`json
{
  "type": "milestone_complete",
  "title": "Milestone Reached",
  "message": "v2.0 Release - All tasks completed",
  "priority": "normal"
}
\`\`\`

## Customization

### Changing Notification Frequency

Edit \`lib/cron-tasks.ts\` to adjust timing:

\`\`\`typescript
const CHECK_INTERVAL = 60 * 60 * 1000 // 1 hour
const ALERT_BEFORE_HOURS = 2 // Alert 2 hours before
\`\`\`

### Custom Alert Logic

Implement in \`lib/cron-tasks.ts\`:

\`\`\`typescript
export async function checkCustomConditions() {
  // Add your custom logic here
}
\`\`\`

## Monitoring

Monitor cron job execution:
- Check logs in /api/cron/logs
- Track notification delivery rates
- Monitor error counts
- Review performance metrics

## Best Practices

1. **Set appropriate intervals**: Don't run too frequently
2. **Handle errors gracefully**: Implement retry logic
3. **Log all executions**: Track what ran and when
4. **Test before deploying**: Verify in staging
5. **Monitor performance**: Watch for slow jobs
6. **Set notifications wisely**: Avoid alert fatigue
`,
  },
]
