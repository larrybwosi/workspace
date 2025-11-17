"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Clock, Users, Filter, Download, Upload, Share2, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskCreateEditDialog } from "./task-create-edit-dialog"
import { EventCreateEditDialog } from "./event-create-edit-dialog"
import { CalendarIntegrationsDialog } from "./calendar-integrations-dialog"
import { CalendarShareDialog } from "./calendar-share-dialog"
import { CalendarContextMenu } from "./calendar-context-menu"
import { DayTasksDialog } from "./day-tasks-dialog"
import { QuickNoteDialog } from "./quick-note-dialog"
import { ScheduledNotificationsPanel } from "./scheduled-notifications-panel"
import { cn } from "@/lib/utils"
import type { Task, CalendarEvent } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface CalendarViewProps {
  onTaskClick?: (task: Task) => void
}

export function CalendarView({ onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [viewMode, setViewMode] = React.useState<"month" | "week" | "day">("month")
  const [taskCreateOpen, setTaskCreateOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [events, setEvents] = React.useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Design Homepage Wireframe",
      type: "task",
      startDate: new Date(2024, 1, 15),
      endDate: new Date(2024, 1, 15),
      assignees: ["user-2", "user-3"],
      color: "#3b82f6",
    },
    {
      id: "2",
      title: "Sprint Planning",
      type: "meeting",
      startDate: new Date(2024, 1, 18, 10, 0),
      endDate: new Date(2024, 1, 18, 11, 0),
      assignees: ["user-1", "user-2", "user-3", "user-4"],
      color: "#8b5cf6",
    },
    {
      id: "3",
      title: "MVP Launch",
      type: "milestone",
      startDate: new Date(2024, 1, 28),
      endDate: new Date(2024, 1, 28),
      color: "#22c55e",
    },
  ])

  const [integrationsOpen, setIntegrationsOpen] = React.useState(false)
  const [shareOpen, setShareOpen] = React.useState(false)
  const [eventDialogOpen, setEventDialogOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null)
  const [filterType, setFilterType] = React.useState<string>('all')
  const [dayTasksDialogOpen, setDayTasksDialogOpen] = React.useState(false)
  const [quickNoteDialogOpen, setQuickNoteDialogOpen] = React.useState(false)
  const [contextMenuDate, setContextMenuDate] = React.useState<Date | null>(null)
  const [showTeamView, setShowTeamView] = React.useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = React.useState<string[]>([])
  const [showPersonalOnly, setShowPersonalOnly] = React.useState(false)
  const [colorByType, setColorByType] = React.useState(true)
  const { toast } = useToast()

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setTaskCreateOpen(true)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setEventDialogOpen(true)
  }

  const handleExportCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/export?format=ics')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'calendar-export.ics'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error(' Export error:', error)
    }
  }

  const handleContextMenuCreateEvent = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setEventDialogOpen(true)
  }

  const handleContextMenuCreateTask = (date: Date) => {
    setSelectedDate(date)
    setTaskCreateOpen(true)
  }

  const handleContextMenuCreateReminder = (date: Date) => {
    setSelectedDate(date)
    // Create a reminder event
    const reminderEvent: Partial<CalendarEvent> = {
      title: "Reminder",
      type: "reminder",
      startDate: date,
      endDate: date,
      color: "#f59e0b",
    }
    setSelectedEvent(reminderEvent as CalendarEvent)
    setEventDialogOpen(true)
  }

  const handleContextMenuViewTasks = (date: Date) => {
    setContextMenuDate(date)
    setDayTasksDialogOpen(true)
  }

  const handleContextMenuCreateMeeting = (date: Date) => {
    setSelectedDate(date)
    const meetingEvent: Partial<CalendarEvent> = {
      title: "New Meeting",
      type: "meeting",
      startDate: date,
      endDate: date,
      color: "#8b5cf6",
    }
    setSelectedEvent(meetingEvent as CalendarEvent)
    setEventDialogOpen(true)
  }

  const handleContextMenuCopyDate = (date: Date) => {
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    navigator.clipboard.writeText(formattedDate)
    toast({
      title: "Date copied",
      description: `${formattedDate} copied to clipboard`,
    })
  }

  const handleContextMenuCreateRecurring = (date: Date) => {
    setSelectedDate(date)
    const recurringEvent: Partial<CalendarEvent> = {
      title: "Recurring Event",
      type: "meeting",
      startDate: date,
      endDate: date,
      recurring: "weekly",
      color: "#3b82f6",
    }
    setSelectedEvent(recurringEvent as CalendarEvent)
    setEventDialogOpen(true)
  }

  const handleContextMenuQuickNote = (date: Date) => {
    setContextMenuDate(date)
    setQuickNoteDialogOpen(true)
  }

  const handleContextMenuAISchedule = (date: Date) => {
    toast({
      title: "AI Schedule Assistant",
      description: "AI scheduling feature coming soon!",
    })
  }

  const handleQuickNoteSave = (note: string) => {
    console.log(" Saving quick note:", note, "for date:", contextMenuDate)
    toast({
      title: "Note saved",
      description: "Your note has been saved successfully",
    })
  }

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] border border-border bg-muted/20" />)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dateEvents = getEventsForDate(date)
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear()

      days.push(
        <CalendarContextMenu
          key={day}
          date={date}
          onCreateEvent={handleContextMenuCreateEvent}
          onCreateTask={handleContextMenuCreateTask}
          onCreateReminder={handleContextMenuCreateReminder}
          onViewTasks={handleContextMenuViewTasks}
          onCreateMeeting={handleContextMenuCreateMeeting}
          onCopyDate={handleContextMenuCopyDate}
          onCreateRecurring={handleContextMenuCreateRecurring}
          onQuickNote={handleContextMenuQuickNote}
          onAISchedule={handleContextMenuAISchedule}
        >
          <div
            className={cn(
              "min-h-[120px] border border-border p-2 hover:bg-muted/50 cursor-pointer transition-colors",
              isToday && "bg-blue-50 dark:bg-blue-950",
            )}
            onClick={() => handleDateClick(date)}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday && "h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs",
                )}
              >
                {day}
              </span>
              {dateEvents.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {dateEvents.length}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {dateEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="text-xs p-1 rounded truncate"
                  style={{ backgroundColor: event.color + "20", borderLeft: `3px solid ${event.color}` }}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  <div className="flex items-center gap-1">
                    {event.type === "task" && <Clock className="h-3 w-3 shrink-0" />}
                    {event.type === "meeting" && <Users className="h-3 w-3 shrink-0" />}
                    {event.type === "milestone" && <CalendarIcon className="h-3 w-3 shrink-0" />}
                    <span className="truncate">{event.title}</span>
                  </div>
                </div>
              ))}
              {dateEvents.length > 3 && (
                <div className="text-xs text-muted-foreground pl-1">+{dateEvents.length - 3} more</div>
              )}
            </div>
          </div>
        </CalendarContextMenu>,
      )
    }

    return days
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={showPersonalOnly ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPersonalOnly(true)}
            >
              Personal
            </Button>
            <Button
              variant={!showPersonalOnly ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPersonalOnly(false)}
            >
              Team
            </Button>
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="milestone">Milestones</SelectItem>
              <SelectItem value="reminder">Reminders</SelectItem>
            </SelectContent>
          </Select>

          <Select value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week" | "day")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => setIntegrationsOpen(true)}>
            <Settings className="h-4 w-4" />
            Integrations
          </Button>

          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleExportCalendar}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button size="sm" className="gap-2" onClick={() => {
            setSelectedEvent(null)
            setEventDialogOpen(true)
          }}>
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="bg-muted p-2 text-center text-sm font-medium border-b border-border">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {renderMonthView()}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "#3b82f6" }} />
          <span className="text-sm">Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "#8b5cf6" }} />
          <span className="text-sm">Meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "#22c55e" }} />
          <span className="text-sm">Milestones</span>
        </div>
      </div>

      {/* Dialogs */}
      <EventCreateEditDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={selectedEvent}
        onSave={(eventData) => {
          console.log(" Saving event:", eventData)
          setEventDialogOpen(false)
        }}
        mode={selectedEvent ? "edit" : "create"}
        defaultDate={selectedDate || undefined}
      />

      <CalendarIntegrationsDialog
        open={integrationsOpen}
        onOpenChange={setIntegrationsOpen}
      />

      <CalendarShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      <DayTasksDialog
        open={dayTasksDialogOpen}
        onOpenChange={setDayTasksDialogOpen}
        date={contextMenuDate || new Date()}
        tasks={[]}
        events={contextMenuDate ? getEventsForDate(contextMenuDate) : []}
        onCreateTask={() => {
          setDayTasksDialogOpen(false)
          handleContextMenuCreateTask(contextMenuDate || new Date())
        }}
        onTaskClick={(task) => {
          setDayTasksDialogOpen(false)
          onTaskClick?.(task)
        }}
      />

      <QuickNoteDialog
        open={quickNoteDialogOpen}
        onOpenChange={setQuickNoteDialogOpen}
        date={contextMenuDate || new Date()}
        onSave={handleQuickNoteSave}
      />
    </div>
  )
}
