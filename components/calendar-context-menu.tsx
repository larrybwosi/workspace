import * as React from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import { Plus, Calendar, Clock, CheckSquare, Bell, Users, Copy, Repeat, AlertCircle, ListTodo, Sparkles } from 'lucide-react'

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
  return (
    <ContextMenu>
      {children}
      <ContextMenuContent className="w-64">
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
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onViewTasks(date)} className="gap-2">
          <ListTodo className="h-4 w-4" />
          View Tasks for This Day
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onCreateReminder(date)} className="gap-2">
          <Bell className="h-4 w-4" />
          Set Reminder
        </ContextMenuItem>
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Repeat className="h-4 w-4" />
            Recurring Events
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => onCreateRecurring(date)}>
              Daily Event
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateRecurring(date)}>
              Weekly Event
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateRecurring(date)}>
              Monthly Event
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Users className="h-4 w-4" />
            Team Scheduling
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => onCreateMeeting(date)}>
              Team Meeting
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateEvent(date)}>
              Team Event
            </ContextMenuItem>
            <ContextMenuItem>
              Find Available Time
            </ContextMenuItem>
            <ContextMenuItem>
              Schedule with Multiple Teams
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Clock className="h-4 w-4" />
            Time Blocking
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>
              Block 30 minutes
            </ContextMenuItem>
            <ContextMenuItem>
              Block 1 hour
            </ContextMenuItem>
            <ContextMenuItem>
              Block 2 hours
            </ContextMenuItem>
            <ContextMenuItem>
              Focus Time (4 hours)
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onQuickNote(date)} className="gap-2">
          <AlertCircle className="h-4 w-4" />
          Quick Note
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onAISchedule(date)} className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Schedule Assistant
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onCopyDate(date)} className="gap-2">
          <Copy className="h-4 w-4" />
          Copy Date
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
