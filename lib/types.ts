import type React from "react"

export interface User {
  id: string
  name: string
  avatar: string
  role: "Design" | "Management" | "Development" | "Admin"
  status: "online" | "offline" | "away"
}

export interface Reaction {
  emoji: string
  count: number
  users: string[]
}

export type MessageType = "standard" | "approval" | "poll" | "code" | "system" | "comment-request" | "custom" | "report"

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

export interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "done"
  priority: "low" | "medium" | "high"
  assignees: string[]
  dueDate: Date
  startDate?: Date
  linkedChannels: string[]
  linkedMessages: string[]
  comments: number
  links: number
  progress: { completed: number; total: number }
  tags?: string[]
  estimatedHours?: number
  loggedHours?: number
  sprintId?: string
  dependencies?: string[]
  customFields?: Record<string, any>
}

export interface Milestone {
  id: string
  title: string
  description: string
  dueDate: Date
  status: "upcoming" | "in-progress" | "completed" | "overdue"
  tasks: string[]
  progress: number
}

export interface ProjectProgress {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  upcomingTasks: number
  overdueTasks: number
  milestones: Milestone[]
}

export interface Project {
  id: string
  name: string
  icon: string
  description: string
  tasks: Task[]
  members: string[]
  channels: string[]
  startDate: Date
  endDate: Date
  status: "planning" | "active" | "on-hold" | "completed"
  progress: ProjectProgress // Added progress field
  milestones: Milestone[]
}

export interface WBSNode {
  id: string
  title: string
  type: "phase" | "deliverable" | "task" | "subtask"
  status: Task["status"]
  priority: Task["priority"]
  assignees: string[]
  progress: number
  startDate: Date
  endDate: Date
  children?: WBSNode[]
  dependencies?: string[]
  customFields?: Record<string, any>
}

export interface CustomField {
  id: string
  name: string
  type: "text" | "number" | "date" | "select" | "multiselect" | "checkbox" | "url"
  options?: string[]
  required: boolean
  defaultValue?: string
  entityType: "project" | "task"
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  phases: WBSNode[]
  customFields: CustomField[]
  isDefault: boolean
  icon: string
}

export interface WorkflowStage {
  id: string
  name: string
  color: string
  order: number
  isDefault: boolean
}

export interface ProjectWorkflow {
  id: string
  name: string
  stages: WorkflowStage[]
  transitions: Array<{
    from: string
    to: string
    conditions?: string[]
  }>
}

export interface Sprint {
  id: string
  name: string
  goal: string
  startDate: Date
  endDate: Date
  status: "planning" | "active" | "completed"
  tasks: Task[]
  velocity: number
  capacity: number
  projectId: string
}

export interface TimeEntry {
  id: string
  taskId: string
  userId: string
  duration: number
  startTime: Date
  endTime: Date
  description: string
  billable?: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: "task" | "meeting" | "milestone" | "deadline" | "reminder"
  startDate: Date
  endDate: Date
  allDay?: boolean
  location?: string
  attendees?: string[]
  taskId?: string
  color?: string
  recurring?: "daily" | "weekly" | "monthly" | "yearly"
  reminders?: Array<{ minutes: number; type: "notification" | "email" }>
}

export interface NoteFolder {
  id: string
  name: string
  icon: string
  parentId?: string
  order: number
}

export interface NoteLink {
  id: string
  sourceNoteId: string
  targetNoteId: string
  type: "bidirectional" | "reference" | "embed"
}

export interface NoteVersion {
  id: string
  noteId: string
  content: string
  createdBy: string
  createdAt: Date
  changeDescription?: string
}

export interface Note {
  id: string
  title: string
  content: string
  folderId: string
  tags: string[]
  createdBy: string
  createdAt: Date
  lastModified: Date
  isFavorite: boolean
  linkedProjects: string[]
  linkedTasks?: string[]
  collaborators?: string[]
  attachments?: Attachment[]
  backlinks?: string[]
  template?: boolean
  encrypted?: boolean
  shareSettings?: {
    isPublic: boolean
    allowedUsers: string[]
    permissions: Record<string, "read" | "write" | "admin">
  }
}
