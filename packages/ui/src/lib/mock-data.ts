import type { User, Channel, Message, Thread, SearchResult } from "./types"

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
