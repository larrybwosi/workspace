import type { User, Channel, Message, Thread, SearchResult, Task, Project, Note } from "./types"

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Andrew M.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    role: "Management",
    status: "online",
  },
  {
    id: "user-2",
    name: "Diana Taylor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    role: "Design",
    status: "online",
  },
  {
    id: "user-3",
    name: "Daniel Anderson",
    avatar: "https://images.unsplash.com/photo-1500648767791-0a1dd7228f2d?w=100&h=100&fit=crop",
    role: "Design",
    status: "online",
  },
  {
    id: "user-4",
    name: "Sophia Wilson",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    role: "Design",
    status: "online",
  },
  {
    id: "user-5",
    name: "William Johnson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    role: "Design",
    status: "away",
  },
  {
    id: "user-6",
    name: "Emily Davis",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    role: "Development",
    status: "offline",
  },
]

export const mockChannels: Channel[] = [
  {
    id: "general",
    name: "General",
    icon: "🔥",
    unreadCount: 1,
    type: "channel",
  },
  {
    id: "frontend",
    name: "Front-end",
    icon: "#",
    unreadCount: 4,
    type: "channel",
  },
  {
    id: "backend",
    name: "Back-end",
    icon: "#",
    unreadCount: 2,
    type: "channel",
  },
  {
    id: "website",
    name: "Website",
    icon: "🌐",
    type: "channel",
  },
  {
    id: "v3",
    name: "v3.0",
    icon: "⭐",
    type: "channel",
    children: [
      {
        id: "wireframe",
        name: "Wireframe",
        icon: "↳",
        type: "channel",
      },
      {
        id: "design",
        name: "Design",
        icon: "↳",
        type: "channel",
      },
      {
        id: "uikit",
        name: "UI-kit design",
        icon: "↳",
        type: "channel",
      },
    ],
  },
  {
    id: "v2",
    name: "v2.0 - actual version",
    icon: "#",
    type: "channel",
  },
  {
    id: "strategy",
    name: "Strategy",
    icon: "📊",
    type: "channel",
  },
  {
    id: "events",
    name: "Events",
    icon: "🔴",
    type: "channel",
  },
  {
    id: "announcements",
    name: "Announcements",
    icon: "#",
    type: "channel",
  },
  {
    id: "uiux",
    name: "UI/UX",
    icon: "#",
    unreadCount: 2,
    type: "channel",
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "📢",
    type: "channel",
  },
  {
    id: "sales",
    name: "Sales",
    icon: "💰",
    unreadCount: 3,
    type: "channel",
  },
]

export const mockFavorites: Channel[] = [
  {
    id: "fav-sophia",
    name: "Sophia Wilson",
    icon: "👤",
    unreadCount: 2,
    type: "favorite",
  },
  {
    id: "fav-frontend",
    name: "Front-end",
    icon: "#",
    unreadCount: 4,
    type: "favorite",
  },
]

export const mockMessages: Message[] = [
  {
    id: "msg-1",
    userId: "user-2",
    content:
      "Hey team, I wanted to discuss the custom UI-kit we're developing for the site redesign. We need to finalize some components and make key design decisions to ensure consistency across the board. Let's make sure we cover colors, typography, buttons, and any other essential UI elements.\n\n@UX/UI @Sophia",
    timestamp: new Date(Date.now() - 3600000),
    reactions: [
      { emoji: "👍", count: 2, users: ["user-1", "user-3"] },
      { emoji: "😊", count: 1, users: ["user-4"] },
    ],
    mentions: ["@UX/UI", "@Sophia"],
  },
  {
    id: "msg-2",
    userId: "user-3",
    content:
      "I have already prepared all styles and components according to our standards during the design phase, so the UI kit is 90% complete. All that remains is to add some states to the interactive elements and prepare the Lottie files for animations.\n\n@Emily D., please take a look and let me know if you have any questions.",
    timestamp: new Date(Date.now() - 1800000),
    reactions: [
      { emoji: "❤️", count: 1, users: ["user-2"] },
      { emoji: "😊", count: 1, users: ["user-1"] },
    ],
    mentions: ["@Emily D."],
    attachments: [
      {
        id: "att-1",
        name: "Conceptzilla website v3.0",
        type: "link",
        url: "https://www.figma.com",
        size: "www.figma.com",
      },
    ],
  },
  {
    id: "msg-3",
    userId: "user-3",
    content:
      "Okay, keep me updated. @Diana T. I also wanted to remind you to keep the layers organized.\n\nMembers: Diana Taylor, Daniel Anderson",
    timestamp: new Date(Date.now() - 900000),
    reactions: [
      { emoji: "💪", count: 2, users: ["user-2", "user-4"] },
      { emoji: "👍", count: 1, users: ["user-1"] },
    ],
    mentions: ["@Diana T."],
  },
  {
    id: "msg-custom-1",
    userId: "user-1",
    content: "Project Status Update - Website Redesign Q1 2024",
    timestamp: new Date(Date.now() - 600000),
    reactions: [],
    mentions: [],
    messageType: "custom",
    metadata: {
      uiDefinition: {
        layout: "card",
        sections: [
          {
            type: "header",
            content: "📊 Project Status Update",
          },
          {
            type: "body",
            content: "Weekly progress report for Website Redesign - Q1 2024",
          },
          {
            type: "field",
            fields: [
              {
                type: "badge",
                label: "Status",
                value: "On Track",
                className: "bg-green-500/10 text-green-600 border-green-500/20",
              },
              {
                type: "progress",
                label: "Overall Completion",
                value: 75,
              },
              {
                type: "text",
                label: "Next Milestone",
                value: "Beta Release - March 15, 2024",
              },
              {
                type: "text",
                label: "Team Lead",
                value: "Andrew M.",
              },
            ],
          },
          {
            type: "list",
            items: [
              "✅ Design system completed",
              "✅ Homepage wireframes approved",
              "🔄 Component library in progress",
              "⏳ API integration pending",
            ],
          },
          {
            type: "footer",
            content: "Last updated: 10 minutes ago by Andrew M.",
          },
        ],
        actions: [
          {
            id: "view-details",
            label: "View Full Report",
            variant: "default",
            position: "footer",
          },
          {
            id: "export",
            label: "Export",
            variant: "outline",
            position: "footer",
          },
        ],
      },
    },
    actions: [
      {
        id: "view-details",
        label: "View Full Report",
        handler: (messageId, actionId) => {
          console.log("[v0] Viewing project details:", messageId, actionId)
        },
      },
      {
        id: "export",
        label: "Export",
        handler: (messageId, actionId) => {
          console.log("[v0] Exporting report:", messageId, actionId)
        },
      },
    ],
  },
  {
    id: "msg-custom-2",
    userId: "user-4",
    content: "Quick team feedback survey",
    timestamp: new Date(Date.now() - 300000),
    reactions: [{ emoji: "👍", count: 3, users: ["user-1", "user-2", "user-3"] }],
    mentions: [],
    messageType: "custom",
    metadata: {
      uiDefinition: {
        layout: "card",
        sections: [
          {
            type: "header",
            content: "💬 Quick Feedback Survey",
          },
          {
            type: "body",
            content: "Help us improve! How satisfied are you with our new collaboration tools?",
          },
          {
            type: "field",
            fields: [
              {
                type: "select",
                label: "Overall Satisfaction",
                value: "Very Satisfied",
                options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
                editable: true,
              },
              {
                type: "select",
                label: "Most Useful Feature",
                value: "Task Management",
                options: ["Task Management", "Direct Messages", "File Sharing", "Search", "Integrations"],
                editable: true,
              },
              {
                type: "textarea",
                label: "Additional Comments (Optional)",
                value: "",
                editable: true,
                className: "min-h-[80px]",
              },
            ],
          },
        ],
        actions: [
          {
            id: "submit-feedback",
            label: "Submit Feedback",
            variant: "default",
            position: "footer",
          },
          {
            id: "skip",
            label: "Skip",
            variant: "outline",
            position: "footer",
          },
        ],
        theme: {
          backgroundColor: "#fefce8",
          borderColor: "#fde047",
        },
      },
    },
    actions: [
      {
        id: "submit-feedback",
        label: "Submit Feedback",
        handler: (messageId, actionId) => {
          console.log("[v0] Submitting feedback:", messageId, actionId)
        },
      },
      {
        id: "skip",
        label: "Skip",
        handler: (messageId, actionId) => {
          console.log("[v0] Skipping survey:", messageId, actionId)
        },
      },
    ],
  },
  {
    id: "msg-custom-3",
    userId: "user-2",
    content: "New team member introduction",
    timestamp: new Date(Date.now() - 150000),
    reactions: [
      { emoji: "👋", count: 5, users: ["user-1", "user-3", "user-4", "user-5", "user-6"] },
      { emoji: "🎉", count: 2, users: ["user-1", "user-3"] },
    ],
    mentions: [],
    messageType: "custom",
    metadata: {
      uiDefinition: {
        layout: "card",
        sections: [
          {
            type: "header",
            content: "👋 Welcome to the Team!",
            className: "text-center",
          },
          {
            type: "field",
            fields: [
              {
                type: "image",
                value: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
                className: "w-20 h-20 rounded-full mx-auto mb-4",
              },
            ],
          },
          {
            type: "body",
            content: "Diana Taylor",
            className: "text-center font-semibold text-lg",
          },
          {
            type: "body",
            content: "Senior Product Designer",
            className: "text-center text-muted-foreground mb-4",
          },
          {
            type: "field",
            fields: [
              {
                type: "badge",
                label: "Status",
                value: "Available",
                className: "bg-green-500/10 text-green-600",
              },
              {
                type: "text",
                label: "Location",
                value: "San Francisco, CA",
              },
              {
                type: "text",
                label: "Timezone",
                value: "PST (UTC-8)",
              },
              {
                type: "text",
                label: "Joined",
                value: "January 15, 2024",
              },
            ],
          },
          {
            type: "body",
            content:
              "Diana brings 8+ years of experience in product design and has worked with leading tech companies. She's passionate about creating intuitive user experiences.",
            className: "mt-4",
          },
        ],
        actions: [
          {
            id: "send-message",
            label: "Send Message",
            variant: "default",
            position: "inline",
          },
          {
            id: "view-profile",
            label: "View Profile",
            variant: "outline",
            position: "inline",
          },
        ],
      },
    },
    actions: [
      {
        id: "send-message",
        label: "Send Message",
        handler: (messageId, actionId) => {
          console.log("[v0] Opening DM with user:", messageId, actionId)
        },
      },
      {
        id: "view-profile",
        label: "View Profile",
        handler: (messageId, actionId) => {
          console.log("[v0] Viewing user profile:", messageId, actionId)
        },
      },
    ],
  },
  {
    id: "msg-custom-4",
    userId: "user-6",
    content: "Sprint planning metrics",
    timestamp: new Date(Date.now() - 50000),
    reactions: [],
    mentions: [],
    messageType: "custom",
    metadata: {
      uiDefinition: {
        layout: "card",
        sections: [
          {
            type: "header",
            content: "📈 Sprint 24 Metrics",
          },
          {
            type: "body",
            content: "Performance overview for the current sprint cycle",
          },
          {
            type: "grid",
            columns: 2,
            items: [
              "✅ Completed: 18 tasks",
              "🔄 In Progress: 7 tasks",
              "⏳ Pending: 5 tasks",
              "🎯 Velocity: 42 points",
            ],
            className: "my-4",
          },
          {
            type: "field",
            fields: [
              {
                type: "progress",
                label: "Sprint Progress",
                value: 72,
              },
              {
                type: "progress",
                label: "Story Points Completed",
                value: 85,
              },
            ],
          },
          {
            type: "footer",
            content: "Sprint ends in 3 days • Updated 5 minutes ago",
          },
        ],
        actions: [
          {
            id: "view-board",
            label: "View Board",
            variant: "default",
            position: "footer",
          },
        ],
        theme: {
          backgroundColor: "#eff6ff",
          borderColor: "#3b82f6",
        },
      },
    },
    actions: [
      {
        id: "view-board",
        label: "View Board",
        handler: (messageId, actionId) => {
          console.log("[v0] Opening sprint board:", messageId, actionId)
        },
      },
    ],
  },
]

export const mockThread: Thread = {
  id: "thread-1",
  title: "UI-kit design",
  channelId: "uikit",
  messages: mockMessages,
  creator: "user-1",
  dateCreated: new Date("2024-05-28"),
  status: "Active",
  tags: ["design", "ui-kit", "v3.0"],
  tasks: 4,
  linkedThreads: ["Front-end", "UI-kit design standards"],
  members: ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"],
}

export const mockRecentSearches = ["UI-kit design", "responsive-design-guidelines.pdf", "Sophia Wilson", "Front-end"]

export const mockSearchResults: SearchResult[] = [
  {
    type: "file",
    id: "file-1",
    title: "tools.zip",
    content: "Website / v3.0",
    author: "Sophia Wilson",
    timestamp: new Date(Date.now() - 86400000),
    channel: "UI-kit design",
  },
  {
    type: "file",
    id: "file-2",
    title: "responsive-design-guidelines.pdf",
    content: "UI-kit design / UI-kit design",
    author: "Sophia Wilson",
    timestamp: new Date(Date.now() - 172800000),
    channel: "UI-kit design",
  },
  {
    type: "message",
    id: "search-msg-1",
    title: "Back-end dev",
    content: "Hey team, I wanted to discuss the custom UI-kit we're developing for the site redesign...",
    author: "Michael Brown",
    timestamp: new Date(Date.now() - 259200000),
    channel: "Front-end dev",
  },
  {
    type: "message",
    id: "search-msg-2",
    title: "Front-end",
    content: "I have already prepared all styles and components according to our standards...",
    author: "Nathan Mitchell",
    timestamp: new Date(Date.now() - 345600000),
    channel: "Front-end dev",
  },
  {
    type: "thread",
    id: "search-thread-1",
    title: "Design System Updates",
    content: "Discussion about updating the design system with new components",
    author: "Diana Taylor",
    timestamp: new Date(Date.now() - 432000000),
    channel: "Design",
  },
]

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Design Homepage Wireframe",
    description:
      "Discuss layout with the marketing team for alignment. We need to finalize the hero section, navigation structure, and call-to-action placements. The wireframe should include mobile and desktop versions.",
    status: "todo",
    priority: "low",
    assignees: ["user-2", "user-3"],
    dueDate: new Date("2023-11-02"),
    linkedChannels: ["uikit", "design"],
    linkedMessages: ["msg-1"],
    comments: 12,
    links: 1,
    progress: { completed: 0, total: 3 },
  },
  {
    id: "task-2",
    title: "Implement Authentication Flow",
    description:
      "Set up OAuth and session management with support for Google, GitHub, and email/password authentication. Include password reset functionality and email verification.",
    status: "in-progress",
    priority: "high",
    assignees: ["user-6"],
    dueDate: new Date("2023-11-05"),
    linkedChannels: ["frontend", "backend"],
    linkedMessages: [],
    comments: 8,
    links: 2,
    progress: { completed: 2, total: 5 },
  },
  {
    id: "task-3",
    title: "Create Design System Documentation",
    description:
      "Document all components and usage guidelines including color palette, typography, spacing, and component variants. Add code examples and best practices.",
    status: "done",
    priority: "medium",
    assignees: ["user-2", "user-4"],
    dueDate: new Date("2023-10-28"),
    linkedChannels: ["uikit", "design"],
    linkedMessages: ["msg-2"],
    comments: 15,
    links: 3,
    progress: { completed: 3, total: 3 },
  },
  {
    id: "task-4",
    title: "API Integration Testing",
    description:
      "Test all API endpoints for proper error handling, rate limiting, and response times. Document any issues found.",
    status: "in-progress",
    priority: "high",
    assignees: ["user-6", "user-5"],
    dueDate: new Date("2023-11-08"),
    linkedChannels: ["backend"],
    linkedMessages: [],
    comments: 5,
    links: 1,
    progress: { completed: 1, total: 4 },
  },
]

export const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "Website Redesign",
    icon: "🌐",
    description: "Complete redesign of the company website with modern UI/UX",
    tasks: mockTasks.slice(0, 3),
    members: ["user-1", "user-2", "user-3", "user-4"],
    channels: ["website", "design", "uikit"],
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-06-30"),
    status: "active",
    progress: {
      totalTasks: 3,
      completedTasks: 1,
      inProgressTasks: 1,
      upcomingTasks: 1,
      overdueTasks: 0,
      milestones: [],
    },
    milestones: [],
  },
  {
    id: "project-2",
    name: "Mobile App",
    icon: "📱",
    description: "Native mobile application development for iOS and Android",
    tasks: [mockTasks[1], mockTasks[3]],
    members: ["user-5", "user-6"],
    channels: ["frontend", "backend"],
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-08-31"),
    status: "active",
    progress: {
      totalTasks: 2,
      completedTasks: 0,
      inProgressTasks: 2,
      upcomingTasks: 0,
      overdueTasks: 0,
      milestones: [],
    },
    milestones: [],
  },
  {
    id: "project-3",
    name: "Marketing Campaign",
    icon: "📢",
    description: "Q4 marketing campaign planning and execution",
    tasks: [],
    members: ["user-1", "user-4"],
    channels: ["marketing", "strategy"],
    startDate: new Date("2024-10-01"),
    endDate: new Date("2024-12-31"),
    status: "planning",
    progress: {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      upcomingTasks: 0,
      overdueTasks: 0,
      milestones: [],
    },
    milestones: [],
  },
]

export const mockNotes: Note[] = [
  {
    id: "note-1",
    title: "The Essentials of Navigation Architecture.",
    content: `In the ever-evolving landscape of digital design, navigation architecture stands as a cornerstone of user experience (UX). It is the blueprint that guides users through an application or website, ensuring that they can find information quickly and efficiently.

## What is Navigation Architecture?

Navigation architecture refers to the structure and organization of a website or application's navigation system. It encompasses the hierarchy of content, the placement of navigational elements, and the pathways that users take to access different sections of the digital product. Effective navigation architecture is crucial for enhancing usability and improving the overall user experience.

## Why is Navigation Architecture Important?

1. **User Experience:** Good navigation architecture ensures that users can find what they are looking for without frustration. It reduces the cognitive load and makes the digital product intuitive and enjoyable.

2. **Engagement and Retention:** When users can navigate easily, they are more likely to stay longer, explore more content, and return in the future. Poor navigation, on the other hand, can lead to higher bounce rates and lower user retention.

3. **SEO Benefits:** Search engines favor websites with clear and logical navigation structures. A well-organized site makes it easier for search engine crawlers to index pages, which can improve search rankings.`,
    folderId: "folder-2",
    tags: ["Design Thinking", "UI/UX Design"],
    createdBy: "user-1",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isFavorite: true,
    linkedProjects: ["project-1"],
    collaborators: ["user-1", "user-2", "user-3"],
  },
  {
    id: "note-2",
    title: "Typography. Chapter 1. Lesson 3",
    content: `# Typography Fundamentals

Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed.

## Key Concepts

- **Typeface vs Font:** A typeface is the design of letterforms, while a font is the file that contains the typeface.
- **Kerning:** The spacing between individual characters
- **Leading:** The vertical spacing between lines of text
- **Tracking:** The overall spacing of a group of letters

## Best Practices

\`\`\`css
body {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  line-height: 1.6;
  letter-spacing: 0.01em;
}
\`\`\`

> Good typography is invisible. It allows the reader to focus on the content without being distracted by the design.`,
    folderId: "folder-1",
    tags: ["Typography", "Design Fundamentals"],
    createdBy: "user-2",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isFavorite: true,
    linkedProjects: ["project-1"],
    collaborators: ["user-2"],
  },
  {
    id: "note-3",
    title: "Technical task for UX Designer.",
    content: `# UX Designer Task Brief

## Objective
Design a comprehensive user flow for the new dashboard redesign project.

## Requirements

1. **User Research**
   - Conduct user interviews with 5-7 participants
   - Create user personas
   - Map user journey

2. **Design Deliverables**
   - Low-fidelity wireframes
   - High-fidelity mockups
   - Interactive prototype
   
3. **Timeline**
   - Week 1: Research
   - Week 2: Wireframes
   - Week 3: Mockups
   - Week 4: Prototype

## Resources
- [Figma Design System](https://figma.com/design-system)
- User Research Template
- Style Guide v2.0

**Priority:** High
**Deadline:** October 3, 2022`,
    folderId: "folder-2",
    tags: ["Task", "Wireframe", "Homepage"],
    createdBy: "user-1",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isFavorite: true,
    linkedProjects: ["project-1"],
    linkedTasks: ["task-1"],
    collaborators: ["user-1", "user-4"],
  },
  {
    id: "note-4",
    title: "Design System Documentation",
    content: `# Design System Overview

Our design system provides a unified language and consistent experience across all products.

## Components

### Buttons
- Primary
- Secondary
- Destructive
- Ghost

### Colors
\`\`\`
Primary: #3B82F6
Secondary: #8B5CF6
Success: #10B981
Danger: #EF4444
\`\`\`

### Typography Scale
- H1: 36px / 2.25rem
- H2: 30px / 1.875rem
- H3: 24px / 1.5rem
- Body: 16px / 1rem

## Usage Guidelines

Always maintain proper spacing and use semantic HTML elements.`,
    folderId: "folder-1",
    tags: ["Design System", "Documentation"],
    createdBy: "user-3",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isFavorite: false,
    linkedProjects: ["project-1", "project-2"],
    collaborators: ["user-3", "user-1"],
  },
  {
    id: "note-5",
    title: "Meeting Notes - Sprint Planning",
    content: `# Sprint Planning Meeting

**Date:** October 15, 2022
**Attendees:** @Andrew M., @Diana T., @Daniel A.

## Agenda

1. Review last sprint
2. Plan upcoming sprint
3. Assign tasks

## Action Items

- [ ] Design homepage mockups - @Diana T.
- [ ] Implement authentication - @Daniel A.
- [ ] User testing session - @Andrew M.

## Key Decisions

We decided to prioritize the dashboard redesign over the mobile app for this sprint. The dashboard has higher user engagement and will provide more immediate value.

## Next Steps

1. All mockups due by EOW
2. Development starts Monday
3. QA testing Wednesday`,
    folderId: "folder-4",
    tags: ["Meeting", "Sprint"],
    createdBy: "user-1",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    isFavorite: false,
    linkedProjects: ["project-1"],
    collaborators: ["user-1", "user-2", "user-4"],
  },
]
