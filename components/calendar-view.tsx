"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarIcon,
  Clock,
  Users,
  Download,
  Share2,
  Settings,
  BarChart3,
  Zap,
  Target,
  RefreshCw,
  Filter,
  AlertTriangle,
  EyeOff,
  CalendarPlusIcon as CalendarLucide,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EventCreateEditDialog } from "./event-create-edit-dialog"
import { CalendarIntegrationsDialog } from "./calendar-integrations-dialog"
import { CalendarShareDialog } from "./calendar-share-dialog"
import { CalendarContextMenu } from "./calendar-context-menu"
import { DayTasksDialog } from "./day-tasks-dialog"
import { QuickNoteDialog } from "./quick-note-dialog"
import { cn } from "@/lib/utils"
import type { Task, CalendarEvent } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

interface CalendarViewProps {
  onTaskClick?: (task: Task) => void
  projectId?: string
}

const teamMembers = [
  {
    id: "user-1",
    name: "John Doe",
    avatar: "/thoughtful-man-in-library.png",
    role: "Developer",
    capacity: 40,
    allocated: 32,
  },
  {
    id: "user-2",
    name: "Jane Smith",
    avatar: "/jane-portrait.png",
    role: "Designer",
    capacity: 40,
    allocated: 28,
  },
  { id: "user-3", name: "Mike Johnson", avatar: "/person-named-mike.png", role: "PM", capacity: 40, allocated: 36 },
  { id: "user-4", name: "Sarah Wilson", avatar: "/diverse-group-smiling.png", role: "QA", capacity: 40, allocated: 24 },
]

export function CalendarView({ onTaskClick, projectId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [viewMode, setViewMode] = React.useState<"month" | "week" | "day" | "agenda" | "resource">("month")
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
  const [filterType, setFilterType] = React.useState<string>("all")
  const [dayTasksDialogOpen, setDayTasksDialogOpen] = React.useState(false)
  const [quickNoteDialogOpen, setQuickNoteDialogOpen] = React.useState(false)
  const [contextMenuDate, setContextMenuDate] = React.useState<Date | null>(null)

  const [showTeamView, setShowTeamView] = React.useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = React.useState<string[]>([])
  const [showPersonalOnly, setShowPersonalOnly] = React.useState(false)
  const [calendarLayout, setCalendarLayout] = React.useState<"grid" | "list" | "timeline">("grid")
  const [showMetrics, setShowMetrics] = React.useState(false)
  const [showResourcePanel, setShowResourcePanel] = React.useState(false)
  const [showConflicts, setShowConflicts] = React.useState(true)
  const [showWorkload, setShowWorkload] = React.useState(false)
  const [compactMode, setCompactMode] = React.useState(false)
  const [showWeekends, setShowWeekends] = React.useState(true)
  const [highlightOverdue, setHighlightOverdue] = React.useState(true)
  const [groupBy, setGroupBy] = React.useState<"none" | "assignee" | "priority" | "type">("none")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [priorityFilter, setPriorityFilter] = React.useState<string[]>(["high", "medium", "low"])
  const [typeFilter, setTypeFilter] = React.useState<string[]>(["task", "meeting", "milestone", "reminder"])

  const { toast } = useToast()

  const metrics = React.useMemo(() => {
    const today = new Date()
    const thisWeekStart = new Date(today.setDate(today.getDate() - today.getDay()))
    const thisWeekEnd = new Date(today.setDate(today.getDate() + 6))

    const totalEvents = events.length
    const meetings = events.filter((e) => e.type === "meeting").length
    const tasks = events.filter((e) => e.type === "task").length
    const milestones = events.filter((e) => e.type === "milestone").length
    const overdue = events.filter((e) => new Date(e.endDate) < new Date() && e.type === "task").length
    const conflicts = 2 // Would calculate from overlapping events
    const utilization = Math.round(
      (teamMembers.reduce((acc, m) => acc + m.allocated, 0) / teamMembers.reduce((acc, m) => acc + m.capacity, 0)) *
        100,
    )

    return { totalEvents, meetings, tasks, milestones, overdue, conflicts, utilization }
  }, [events])

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
      const matchesDate =
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()

      // Apply filters
      if (!matchesDate) return false
      if (filterType !== "all" && event.type !== filterType) return false
      if (!typeFilter.includes(event.type)) return false
      if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (selectedTeamMembers.length > 0 && !event.assignees?.some((a) => selectedTeamMembers.includes(a))) return false

      return true
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

  const handleExportCalendar = async (format: "ics" | "pdf" | "csv") => {
    try {
      const response = await fetch(`/api/calendar/export?format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `calendar-export.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: "Export complete", description: `Calendar exported as ${format.toUpperCase()}` })
    } catch (error) {
      toast({ title: "Export failed", description: "Could not export calendar", variant: "destructive" })
    }
  }

  // Context menu handlers
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
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    navigator.clipboard.writeText(formattedDate)
    toast({ title: "Date copied", description: `${formattedDate} copied to clipboard` })
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
    toast({ title: "AI Schedule Assistant", description: "Analyzing your calendar for optimal scheduling..." })
  }

  const handleQuickNoteSave = (note: string) => {
    toast({ title: "Note saved", description: "Your note has been saved successfully" })
  }

  const renderResourcePanel = () => (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Team Resource Allocation</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowResourcePanel(false)}>
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-3">
          {teamMembers.map((member) => {
            const utilization = Math.round((member.allocated / member.capacity) * 100)
            const isOverloaded = utilization > 90
            return (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{member.name}</span>
                    <span className={cn("text-xs", isOverloaded ? "text-destructive" : "text-muted-foreground")}>
                      {member.allocated}h / {member.capacity}h
                    </span>
                  </div>
                  <Progress value={utilization} className={cn("h-1.5", isOverloaded && "bg-destructive/20")} />
                </div>
                <Badge
                  variant={isOverloaded ? "destructive" : utilization > 70 ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {utilization}%
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  const renderMetricsDashboard = () => (
    <div className="border-b bg-muted/30 p-4">
      <div className="grid grid-cols-7 gap-4">
        <div className="flex flex-col items-center p-3 rounded-lg bg-background border">
          <span className="text-2xl font-bold">{metrics.totalEvents}</span>
          <span className="text-xs text-muted-foreground">Total Events</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-background border">
          <span className="text-2xl font-bold text-purple-600">{metrics.meetings}</span>
          <span className="text-xs text-muted-foreground">Meetings</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-background border">
          <span className="text-2xl font-bold text-blue-600">{metrics.tasks}</span>
          <span className="text-xs text-muted-foreground">Tasks</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-background border">
          <span className="text-2xl font-bold text-green-600">{metrics.milestones}</span>
          <span className="text-xs text-muted-foreground">Milestones</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-background border">
          <span className={cn("text-2xl font-bold", metrics.overdue > 0 && "text-destructive")}>{metrics.overdue}</span>
          <span className="text-xs text-muted-foreground">Overdue</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-background border">
          <span className={cn("text-2xl font-bold", metrics.conflicts > 0 && "text-amber-600")}>
            {metrics.conflicts}
          </span>
          <span className="text-xs text-muted-foreground">Conflicts</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-background border">
          <span className={cn("text-2xl font-bold", metrics.utilization > 85 ? "text-amber-600" : "text-green-600")}>
            {metrics.utilization}%
          </span>
          <span className="text-xs text-muted-foreground">Utilization</span>
        </div>
      </div>
    </div>
  )

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className={cn("min-h-[100px] border border-border bg-muted/20", compactMode && "min-h-[60px]")}
        />,
      )
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dateEvents = getEventsForDate(date)
      const isToday = date.toDateString() === new Date().toDateString()
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const hasOverdue = dateEvents.some((e) => e.type === "task" && new Date(e.endDate) < new Date())

      if (!showWeekends && isWeekend) continue

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
              "min-h-[100px] border border-border p-2 hover:bg-muted/50 cursor-pointer transition-colors relative",
              isToday && "bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-500 ring-inset",
              isWeekend && "bg-muted/30",
              hasOverdue && highlightOverdue && "border-l-2 border-l-destructive",
              compactMode && "min-h-[60px] p-1",
            )}
            onClick={() => handleDateClick(date)}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday && "h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs",
                )}
              >
                {day}
              </span>
              <div className="flex items-center gap-1">
                {hasOverdue && highlightOverdue && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent>Overdue tasks</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {dateEvents.length > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {dateEvents.length}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-0.5">
              {dateEvents.slice(0, compactMode ? 2 : 3).map((event) => (
                <div
                  key={event.id}
                  className={cn("text-xs p-1 rounded truncate cursor-pointer hover:opacity-80", compactMode && "p-0.5")}
                  style={{ backgroundColor: event.color + "20", borderLeft: `3px solid ${event.color}` }}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  <div className="flex items-center gap-1">
                    {event.type === "task" && <Clock className="h-3 w-3 flex-shrink-0" />}
                    {event.type === "meeting" && <Users className="h-3 w-3 flex-shrink-0" />}
                    {event.type === "milestone" && <Target className="h-3 w-3 flex-shrink-0" />}
                    {event.type === "reminder" && <CalendarIcon className="h-3 w-3 flex-shrink-0" />}
                    <span className="truncate">{event.title}</span>
                  </div>
                </div>
              ))}
              {dateEvents.length > (compactMode ? 2 : 3) && (
                <div className="text-xs text-muted-foreground pl-1">
                  +{dateEvents.length - (compactMode ? 2 : 3)} more
                </div>
              )}
            </div>
          </div>
        </CalendarContextMenu>,
      )
    }

    return days
  }

  const renderAgendaView = () => {
    const upcomingEvents = events
      .filter((e) => new Date(e.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 20)

    return (
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-2 p-4">
          {upcomingEvents.map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={(e) => handleEventClick(event, e as any)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: event.color + "20" }}
                >
                  {event.type === "task" && <Clock className="h-6 w-6" style={{ color: event.color }} />}
                  {event.type === "meeting" && <Users className="h-6 w-6" style={{ color: event.color }} />}
                  {event.type === "milestone" && <Target className="h-6 w-6" style={{ color: event.color }} />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {event.type === "meeting" &&
                      ` at ${new Date(event.startDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                  </p>
                </div>
                <Badge
                  style={{ backgroundColor: event.color + "20", color: event.color, borderColor: event.color }}
                  variant="outline"
                >
                  {event.type}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
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

        <div className="flex items-center gap-2 flex-1 justify-center">
          {/* Search */}
          <div className="relative w-64">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9"
            />
            <CalendarLucide className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {/* View mode selector */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="month" className="text-xs px-3">
                Month
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3">
                Week
              </TabsTrigger>
              <TabsTrigger value="day" className="text-xs px-3">
                Day
              </TabsTrigger>
              <TabsTrigger value="agenda" className="text-xs px-3">
                Agenda
              </TabsTrigger>
              <TabsTrigger value="resource" className="text-xs px-3">
                Resources
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {/* Team filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Users className="h-4 w-4" />
                Team
                {selectedTeamMembers.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTeamMembers.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter by Team Member</h4>
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <Checkbox
                      id={member.id}
                      checked={selectedTeamMembers.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTeamMembers([...selectedTeamMembers, member.id])
                        } else {
                          setSelectedTeamMembers(selectedTeamMembers.filter((id) => id !== member.id))
                        }
                      }}
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor={member.id} className="text-sm cursor-pointer">
                      {member.name}
                    </label>
                  </div>
                ))}
                {selectedTeamMembers.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setSelectedTeamMembers([])}>
                    Clear All
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Event Types</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes("task")}
                onCheckedChange={(c) =>
                  c ? setTypeFilter([...typeFilter, "task"]) : setTypeFilter(typeFilter.filter((t) => t !== "task"))
                }
              >
                Tasks
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes("meeting")}
                onCheckedChange={(c) =>
                  c
                    ? setTypeFilter([...typeFilter, "meeting"])
                    : setTypeFilter(typeFilter.filter((t) => t !== "meeting"))
                }
              >
                Meetings
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes("milestone")}
                onCheckedChange={(c) =>
                  c
                    ? setTypeFilter([...typeFilter, "milestone"])
                    : setTypeFilter(typeFilter.filter((t) => t !== "milestone"))
                }
              >
                Milestones
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes("reminder")}
                onCheckedChange={(c) =>
                  c
                    ? setTypeFilter([...typeFilter, "reminder"])
                    : setTypeFilter(typeFilter.filter((t) => t !== "reminder"))
                }
              >
                Reminders
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>View Options</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={showWeekends} onCheckedChange={setShowWeekends}>
                Show Weekends
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={highlightOverdue} onCheckedChange={setHighlightOverdue}>
                Highlight Overdue
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={compactMode} onCheckedChange={setCompactMode}>
                Compact Mode
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Group By
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupBy("assignee")}>Assignee</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupBy("priority")}>Priority</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupBy("type")}>Type</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Zap className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowMetrics(!showMetrics)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {showMetrics ? "Hide" : "Show"} Metrics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowResourcePanel(!showResourcePanel)}>
                <Users className="h-4 w-4 mr-2" />
                {showResourcePanel ? "Hide" : "Show"} Resources
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIntegrationsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Integrations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Calendar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleExportCalendar("ics")}>iCal (.ics)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportCalendar("pdf")}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportCalendar("csv")}>CSV</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add event button */}
          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              setSelectedEvent(null)
              setEventDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Metrics dashboard */}
      {showMetrics && renderMetricsDashboard()}

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Resource panel */}
        {showResourcePanel && renderResourcePanel()}

        {/* Calendar views */}
        {viewMode === "month" && (
          <div
            className={cn(
              "grid gap-0 border border-border rounded-lg overflow-hidden",
              showWeekends ? "grid-cols-7" : "grid-cols-5",
            )}
          >
            {(showWeekends
              ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
              : ["Mon", "Tue", "Wed", "Thu", "Fri"]
            ).map((day) => (
              <div key={day} className="bg-muted p-2 text-center text-sm font-medium border-b border-border">
                {day}
              </div>
            ))}
            {renderMonthView()}
          </div>
        )}

        {viewMode === "agenda" && renderAgendaView()}

        {viewMode === "resource" && (
          <div className="space-y-4">
            {renderResourcePanel()}
            <Card>
              <CardHeader>
                <CardTitle>Resource Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Drag and drop to assign resources to events</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <span className="text-xs">Tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#8b5cf6" }} />
            <span className="text-xs">Meetings</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#22c55e" }} />
            <span className="text-xs">Milestones</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
            <span className="text-xs">Reminders</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{events.length} events</span>
          <span>|</span>
          <span>{metrics.utilization}% team utilization</span>
        </div>
      </div>

      {/* Dialogs */}
      <EventCreateEditDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={selectedEvent}
        onSave={(eventData) => {
          setEventDialogOpen(false)
        }}
        mode={selectedEvent?.id ? "edit" : "create"}
        defaultDate={selectedDate || undefined}
      />
      <CalendarIntegrationsDialog open={integrationsOpen} onOpenChange={setIntegrationsOpen} />
      <CalendarShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      <DayTasksDialog
        open={dayTasksDialogOpen}
        onOpenChange={setDayTasksDialogOpen}
        date={contextMenuDate || new Date()}
        tasks={[]}
        events={events}
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
