"use client"

import * as React from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuCheckboxItem,
} from "@/components/ui/context-menu"
import {
  Plus,
  Clock,
  CheckSquare,
  Bell,
  Users,
  Copy,
  Repeat,
  ListTodo,
  Sparkles,
  FileText,
  Link,
  Video,
  Phone,
  Mail,
  Tag,
  Archive,
  Trash2,
  Share2,
  Download,
  Upload,
  Flag,
  Target,
  Zap,
} from "lucide-react"

interface CalendarContextMenuProps {
  children: React.ReactNode
  date: Date
  onCreateEvent: (date: Date) => void
  onCreateTask: (date: Date) => void
  onCreateReminder: (date: Date) => void
  onViewTasks: (date: Date) => void
  onCreateMeeting: (date: Date) => void
  onCopyDate: (date: Date) => void
  onCreateRecurring: (date: Date) => void
  onQuickNote: (date: Date) => void
  onAISchedule: (date: Date) => void
}

export function CalendarContextMenu({
  children,
  date,
  onCreateEvent,
  onCreateTask,
  onCreateReminder,
  onViewTasks,
  onCreateMeeting,
  onCopyDate,
  onCreateRecurring,
  onQuickNote,
  onAISchedule,
}: CalendarContextMenuProps) {
  const [showCompleted, setShowCompleted] = React.useState(true)

  return (
    <ContextMenu>
      {children}
      <ContextMenuContent className="w-72">
        {/* Quick Actions section with common create actions */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Quick Actions</div>
        <ContextMenuItem onClick={() => onCreateEvent(date)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Event
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onCreateTask(date)} className="gap-2">
          <CheckSquare className="h-4 w-4" />
          Add Task
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onCreateMeeting(date)} className="gap-2">
          <Users className="h-4 w-4" />
          Schedule Meeting
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onCreateReminder(date)} className="gap-2">
          <Bell className="h-4 w-4" />
          Set Reminder
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Communication Tools submenu */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Communication</div>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Video className="h-4 w-4" />
            Video Conference
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuItem onClick={() => onCreateMeeting(date)}>
              <Zap className="h-4 w-4 mr-2" />
              Instant Meeting
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateMeeting(date)}>
              <Clock className="h-4 w-4 mr-2" />
              Schedule Video Call
            </ContextMenuItem>
            <ContextMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Webinar (Up to 100 participants)
            </ContextMenuItem>
            <ContextMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              Record Meeting
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem className="gap-2">
          <Phone className="h-4 w-4" />
          Schedule Call
        </ContextMenuItem>

        <ContextMenuItem className="gap-2">
          <Mail className="h-4 w-4" />
          Send Email Invite
        </ContextMenuItem>

        <ContextMenuSeparator />

        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Team Collaboration</div>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Users className="h-4 w-4" />
            Team Scheduling
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuItem onClick={() => onCreateMeeting(date)}>
              <Users className="h-4 w-4 mr-2" />
              Team Meeting
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateEvent(date)}>
              <Target className="h-4 w-4 mr-2" />
              Sprint Planning
            </ContextMenuItem>
            <ContextMenuItem>
              <Clock className="h-4 w-4 mr-2" />
              Find Available Time
            </ContextMenuItem>
            <ContextMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Multi-Team Sync
            </ContextMenuItem>
            <ContextMenuItem>
              <Flag className="h-4 w-4 mr-2" />
              All-Hands Meeting
            </ContextMenuItem>
            <ContextMenuItem>
              <Zap className="h-4 w-4 mr-2" />
              Stand-up (15 min)
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Clock className="h-4 w-4" />
            Time Blocking
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuItem>
              <Clock className="h-4 w-4 mr-2" />
              Quick Block (30 min)
            </ContextMenuItem>
            <ContextMenuItem>
              <Clock className="h-4 w-4 mr-2" />
              Standard Block (1 hour)
            </ContextMenuItem>
            <ContextMenuItem>
              <Clock className="h-4 w-4 mr-2" />
              Extended Block (2 hours)
            </ContextMenuItem>
            <ContextMenuItem>
              <Target className="h-4 w-4 mr-2" />
              Deep Focus (4 hours)
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Bell className="h-4 w-4 mr-2" />
              Do Not Disturb
            </ContextMenuItem>
            <ContextMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Office Hours
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem onClick={() => onViewTasks(date)} className="gap-2">
          <ListTodo className="h-4 w-4" />
          View All Tasks & Events
        </ContextMenuItem>

        <ContextMenuSeparator />

        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Recurring & Templates</div>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Repeat className="h-4 w-4" />
            Recurring Events
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuItem onClick={() => onCreateRecurring(date)}>
              <Repeat className="h-4 w-4 mr-2" />
              Daily Event
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateRecurring(date)}>
              <Repeat className="h-4 w-4 mr-2" />
              Weekly Event
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateRecurring(date)}>
              <Repeat className="h-4 w-4 mr-2" />
              Bi-weekly Event
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateRecurring(date)}>
              <Repeat className="h-4 w-4 mr-2" />
              Monthly Event
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateRecurring(date)}>
              <Repeat className="h-4 w-4 mr-2" />
              Quarterly Review
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              Custom Recurrence Pattern
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <FileText className="h-4 w-4" />
            Event Templates
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Team Standup Template
            </ContextMenuItem>
            <ContextMenuItem>
              <Target className="h-4 w-4 mr-2" />
              Sprint Review Template
            </ContextMenuItem>
            <ContextMenuItem>
              <Video className="h-4 w-4 mr-2" />
              Client Demo Template
            </ContextMenuItem>
            <ContextMenuItem>
              <CheckSquare className="h-4 w-4 mr-2" />
              1-on-1 Template
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Plus className="h-4 w-4 mr-2" />
              Create Template from Event
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Productivity</div>
        <ContextMenuItem onClick={() => onQuickNote(date)} className="gap-2">
          <FileText className="h-4 w-4" />
          Quick Note
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Tag className="h-4 w-4" />
            Labels & Tags
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuItem>
              <div className="h-3 w-3 rounded-full bg-red-500 mr-2" />
              High Priority
            </ContextMenuItem>
            <ContextMenuItem>
              <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2" />
              Medium Priority
            </ContextMenuItem>
            <ContextMenuItem>
              <div className="h-3 w-3 rounded-full bg-blue-500 mr-2" />
              Low Priority
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Tag className="h-4 w-4 mr-2" />
              Add Custom Label
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem onClick={() => onAISchedule(date)} className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Schedule Assistant
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Features
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuItem>
              <Sparkles className="h-4 w-4 mr-2" />
              Suggest Optimal Time
            </ContextMenuItem>
            <ContextMenuItem>
              <Target className="h-4 w-4 mr-2" />
              Auto-prioritize Tasks
            </ContextMenuItem>
            <ContextMenuItem>
              <Clock className="h-4 w-4 mr-2" />
              Time Estimate Assistant
            </ContextMenuItem>
            <ContextMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Smart Attendee Suggestions
            </ContextMenuItem>
            <ContextMenuItem>
              <Bell className="h-4 w-4 mr-2" />
              Intelligent Reminders
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Data Management</div>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Share2 className="h-4 w-4" />
            Share & Export
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              Share Day View
            </ContextMenuItem>
            <ContextMenuItem>
              <Link className="h-4 w-4 mr-2" />
              Copy Calendar Link
            </ContextMenuItem>
            <ContextMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export to iCal
            </ContextMenuItem>
            <ContextMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </ContextMenuItem>
            <ContextMenuItem>
              <Mail className="h-4 w-4 mr-2" />
              Email Schedule
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Archive className="h-4 w-4" />
            Bulk Actions
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            <ContextMenuItem>
              <CheckSquare className="h-4 w-4 mr-2" />
              Complete All Tasks
            </ContextMenuItem>
            <ContextMenuItem>
              <Archive className="h-4 w-4 mr-2" />
              Archive Past Events
            </ContextMenuItem>
            <ContextMenuItem>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Day
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Upload className="h-4 w-4 mr-2" />
              Import Events
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">View Options</div>
        <ContextMenuCheckboxItem checked={showCompleted} onCheckedChange={setShowCompleted}>
          <CheckSquare className="h-4 w-4 mr-2" />
          Show Completed Tasks
        </ContextMenuCheckboxItem>

        <ContextMenuItem onClick={() => onCopyDate(date)} className="gap-2">
          <Copy className="h-4 w-4" />
          Copy Date
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
