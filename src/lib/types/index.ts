import type React from "react"

export interface User {
  id: string
  name: string
  username?: string
  avatar: string
  image?: string
  banner?: string
  statusText?: string
  statusEmoji?: string
  role: "Design" | "Management" | "Development" | "Admin"
  status: "online" | "offline" | "away"
}

export interface Reaction {
  emoji: string
  count: number
  users: string[]
}

export type MessageType = "standard" | "approval" | "poll" | "code" | "system" | "comment-request" | "custom" | "report" | "document"

export interface MessageAction {
  id: string
  label: string
  variant?: "default" | "destructive" | "outline" | "secondary"
  icon?: string
  handler?: (messageId: string, actionId: string) => void
}

export interface MessageMetadata {
  approvalStatus?: "pending" | "approved" | "rejected"
  approvedBy?: string
  approvalComment?: string
  language?: string
  fileName?: string
  pollOptions?: Array<{ id: string; text: string; votes: number }>
  pollEndsAt?: Date
  commentsEnabled?: boolean
  comments?: Array<{
    id: string
    userId: string
    content: string
    timestamp: Date
  }>
  [key: string]: any
}

export interface CustomMessageComponent {
  type: MessageType
  render: (message: Message, metadata: MessageMetadata) => React.ReactNode
  actions?: MessageAction[]
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  reactions: Reaction[];
  mentions: string[];
  attachments?: Attachment[];
  isEdited?: boolean;
  messageType?: MessageType;
  metadata?: MessageMetadata;
  actions?: MessageAction[];
  replyTo?: string;
  replies?: Message[];
  depth?: number;
  readByCurrentUser?: boolean;
}

export interface Thread {
  id: string
  title: string
  channelId: string
  messages: Message[]
  creator: string
  dateCreated: Date
  status: "Active" | "Archived" | "Closed"
  tags: string[]
  tasks: number
  linkedThreads: string[]
  members: string[]
}

export interface Channel {
  id: string
  name: string
  icon: string
  unreadCount?: number
  type: "channel" | "dm" | "favorite"
  children?: Channel[]
}

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
  size?: string
}

export interface SearchResult {
  type: "message" | "file" | "thread"
  id: string
  title: string
  content: string
  author: string
  timestamp: Date
  channel?: string
}
