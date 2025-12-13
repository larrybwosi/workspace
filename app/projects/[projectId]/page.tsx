"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TaskDetailSheet } from "@/components/task-detail-sheet"
import { useProject } from "@/hooks/api/use-projects"
import { useTasks } from "@/hooks/api/use-tasks"
import type { Task } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  Star,
  Bell,
  Settings,
  Plus,
  Activity,
  Calendar,
  MoreHorizontal,
  Download,
  Copy,
  Archive,
  Trash2,
  GitBranch,
  Eye,
  EyeOff,
  Bookmark,
  Filter,
  Search,
  List,
  Kanban,
  BarChart3,
  PieChart,
  Layers,
  FileText,
  Palette,
  ImageIcon,
  CheckSquare,
  CircleDot,
  Circle,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  Flame,
  Sparkles,
  Table,
  GanttChart,
  Rocket,
  Bug,
  Lightbulb,
  HelpCircle,
  XCircle,
  PlayCircle,
  ChevronRight,
  Component,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { mockUsers } from "@/lib/mock-data"
import { Checkbox } from "@/components/ui/checkbox"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const { data: project, isLoading, refetch } = useProject(projectId)
  const { data: tasks } = useTasks(projectId)

  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [taskSheetOpen, setTaskSheetOpen] = React.useState(false)
  const [isStarred, setIsStarred] = React.useState(false)
  const [isWatching, setIsWatching] = React.useState(true)
  const [activeView, setActiveView] = React.useState("board")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showFilters, setShowFilters] = React.useState(false)
  const [groupBy, setGroupBy] = React.useState("status")
  const [sortBy, setSortBy] = React.useState("priority")

  // Customization state
  const [customizeDialogOpen, setCustomizeDialogOpen] = React.useState(false)
  const [projectIcon, setProjectIcon] = React.useState(project?.icon || "📁")
  const [projectCover, setProjectCover] = React.useState<string | null>(null)
  const [showDescription, setShowDescription] = React.useState(true)
  const [showMetrics, setShowMetrics] = React.useState(true)
  const [compactMode, setCompactMode] = React.useState(false)

  // Filter state
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = React.useState<string[]>([])
  const [assigneeFilter, setAssigneeFilter] = React.useState<string[]>([])
  const [labelFilter, setLabelFilter] = React.useState<string[]>([])

  // Quick create state
  const [quickCreateOpen, setQuickCreateOpen] = React.useState(false)
  const [quickCreateTitle, setQuickCreateTitle] = React.useState("")
  const [quickCreateStatus, setQuickCreateStatus] = React.useState("backlog")

  // Custom statuses with colors
  const statuses = [
    { id: "backlog", name: "Backlog", color: "#6B7280", icon: Circle },
    { id: "todo", name: "To Do", color: "#8B5CF6", icon: CircleDot },
    { id: "in-progress", name: "In Progress", color: "#F59E0B", icon: PlayCircle },
    { id: "in-review", name: "In Review", color: "#3B82F6", icon: Eye },
    { id: "done", name: "Done", color: "#10B981", icon: CheckCircle2 },
    { id: "cancelled", name: "Cancelled", color: "#EF4444", icon: XCircle },
  ]

  // Custom priorities
  const priorities = [
    { id: "urgent", name: "Urgent", color: "#DC2626", icon: Flame },
    { id: "high", name: "High", color: "#F97316", icon: ArrowUpCircle },
    { id: "medium", name: "Medium", color: "#FBBF24", icon: MinusCircle },
    { id: "low", name: "Low", color: "#22C55E", icon: ArrowDownCircle },
    { id: "none", name: "No Priority", color: "#6B7280", icon: Circle },
  ]

  // Custom labels
  const labels = [
    { id: "bug", name: "Bug", color: "#EF4444", icon: Bug },
    { id: "feature", name: "Feature", color: "#8B5CF6", icon: Sparkles },
    { id: "improvement", name: "Improvement", color: "#3B82F6", icon: Lightbulb },
    { id: "documentation", name: "Documentation", color: "#6B7280", icon: FileText },
    { id: "question", name: "Question", color: "#F59E0B", icon: HelpCircle },
  ]

  // Issue types like Jira
  const issueTypes = [
    { id: "task", name: "Task", color: "#3B82F6", icon: CheckSquare },
    { id: "story", name: "Story", color: "#10B981", icon: Bookmark },
    { id: "bug", name: "Bug", color: "#EF4444", icon: Bug },
    { id: "epic", name: "Epic", color: "#8B5CF6", icon: Rocket },
    { id: "subtask", name: "Sub-task", color: "#6B7280", icon: Component },
  ]

  const projectMetrics = React.useMemo(() => {
    const taskList = tasks || []
    const total = taskList.length
    const completed = taskList.filter((t) => t.status === "done").length
    const inProgress = taskList.filter((t) => t.status === "in-progress").length
    const inReview = taskList.filter((t) => t.status === "in-review").length
    const backlog = taskList.filter((t) => t.status === "backlog").length
    const todo = taskList.filter((t) => t.status === "todo").length
    const overdue = taskList.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length
    const highPriority = taskList.filter((t) => t.priority === "high" || t.priority === "urgent").length
    const blockedTasks = taskList.filter((t) => t.status === "blocked").length
    const dueThisWeek = taskList.filter((t) => {
      if (!t.dueDate) return false
      const dueDate = new Date(t.dueDate)
      const today = new Date()
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      return dueDate >= today && dueDate <= weekFromNow && t.status !== "done"
    }).length

    return {
      total,
      completed,
      inProgress,
      inReview,
      backlog,
      todo,
      overdue,
      highPriority,
      blockedTasks,
      dueThisWeek,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [tasks])

  // Filter tasks
  const filteredTasks = React.useMemo(() => {
    let filtered = tasks || []

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) => task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query),
      )
    }

    if (statusFilter.length > 0) {
      filtered = filtered.filter((task) => statusFilter.includes(task.status))
    }

    if (priorityFilter.length > 0) {
      filtered = filtered.filter((task) => priorityFilter.includes(task.priority))
    }

    if (assigneeFilter.length > 0) {
      filtered = filtered.filter((task) => task.assignees?.some((a) => assigneeFilter.includes(a)))
    }

    return filtered
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter])

  // Group tasks by selected field
  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, Task[]> = {}

    filteredTasks.forEach((task) => {
      let groupKey = ""

      switch (groupBy) {
        case "status":
          groupKey = task.status
          break
        case "priority":
          groupKey = task.priority
          break
        case "assignee":
          groupKey = task.assignees?.[0] || "unassigned"
          break
        case "label":
          groupKey = "none"
          break
        default:
          groupKey = task.status
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(task)
    })

    return groups
  }, [filteredTasks, groupBy])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setTaskSheetOpen(true)
  }

  const handleChannelSelect = (channelId: string) => {
    if (channelId === "assistant") {
      router.push("/assistant")
    } else if (channelId.startsWith("project-")) {
      router.push(`/projects/${channelId}`)
    } else {
      router.push(`/channels/${channelId}`)
    }
  }

  const handleQuickCreate = () => {
    if (!quickCreateTitle.trim()) return
    toast.success(`Task "${quickCreateTitle}" created`)
    setQuickCreateTitle("")
    setQuickCreateOpen(false)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-sm">Loading project...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Project Not Found</h1>
            <p className="text-muted-foreground text-sm mb-6">
              The project you're looking for doesn't exist or you don't have access.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={projectId}
        onChannelSelect={handleChannelSelect}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Project Cover Image (Notion-like) */}
        {projectCover && (
          <div className="relative h-48 w-full overflow-hidden group">
            <img src={projectCover || "/placeholder.svg"} alt="Project cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setProjectCover(null)}
            >
              Remove cover
            </Button>
          </div>
        )}

        {/* Project Header */}
        <div className={cn("border-b border-border bg-card/50 backdrop-blur-sm", !projectCover && "sticky top-0 z-10")}>
          <div className="px-6 py-4">
            {/* Breadcrumb and actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setSidebarOpen(true)}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
                <nav className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => router.push("/")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Projects
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{project.name}</span>
                </nav>
              </div>

              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsStarred(!isStarred)}>
                        <Star className={cn("h-4 w-4", isStarred && "fill-yellow-400 text-yellow-400")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isStarred ? "Unstar" : "Star"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsWatching(!isWatching)}
                      >
                        {isWatching ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isWatching ? "Unwatch" : "Watch"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bell className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCustomizeDialogOpen(true)}>
                  <Palette className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="gap-2">
                      <Settings className="h-4 w-4" />
                      Project settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => setCustomizeDialogOpen(true)}>
                      <Palette className="h-4 w-4" />
                      Customize
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2">
                      <Copy className="h-4 w-4" />
                      Duplicate project
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <GitBranch className="h-4 w-4" />
                      Create template
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                        <DropdownMenuItem>Export as JSON</DropdownMenuItem>
                        <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2">
                      <Archive className="h-4 w-4" />
                      Archive project
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Project Title with Icon (Notion-like) */}
            <div className="flex items-start gap-4 mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-3xl hover:border-primary/40 transition-colors cursor-pointer">
                    {projectIcon}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground mb-2">Choose an icon</p>
                    <div className="grid grid-cols-8 gap-1">
                      {[
                        "📁",
                        "📊",
                        "🚀",
                        "💡",
                        "🎯",
                        "⚡",
                        "🔥",
                        "✨",
                        "📈",
                        "🎨",
                        "💼",
                        "🔧",
                        "📱",
                        "🌐",
                        "🎮",
                        "📝",
                      ].map((icon) => (
                        <button
                          key={icon}
                          className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center text-lg"
                          onClick={() => setProjectIcon(icon)}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                  <Badge variant="outline" className="capitalize bg-green-500/10 text-green-600 border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                    {project.status || "Active"}
                  </Badge>
                </div>
                {showDescription && (
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {project.description || "Click to add a description..."}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "No start date"} -{" "}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "No end date"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {mockUsers.length} members
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {projectMetrics.total} issues
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Users className="h-4 w-4" />
                  Invite
                </Button>
                <Button size="sm" className="gap-2" onClick={() => setQuickCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Issue
                </Button>
              </div>
            </div>

            {/* Metrics Cards */}
            {showMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                {[
                  { label: "Total", value: projectMetrics.total, icon: Target, color: "text-foreground" },
                  { label: "Done", value: projectMetrics.completed, icon: CheckCircle2, color: "text-green-600" },
                  { label: "In Progress", value: projectMetrics.inProgress, icon: Activity, color: "text-blue-600" },
                  { label: "In Review", value: projectMetrics.inReview, icon: Eye, color: "text-purple-600" },
                  { label: "Overdue", value: projectMetrics.overdue, icon: AlertTriangle, color: "text-red-600" },
                  { label: "High Priority", value: projectMetrics.highPriority, icon: Flame, color: "text-orange-600" },
                ].map((metric) => (
                  <Card
                    key={metric.label}
                    className="bg-card/50 border-border/50 hover:border-border transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                          <p className={cn("text-xl font-bold", metric.color)}>{metric.value}</p>
                        </div>
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center",
                            metric.color === "text-green-600"
                              ? "bg-green-500/10"
                              : metric.color === "text-blue-600"
                                ? "bg-blue-500/10"
                                : metric.color === "text-red-600"
                                  ? "bg-red-500/10"
                                  : metric.color === "text-orange-600"
                                    ? "bg-orange-500/10"
                                    : metric.color === "text-purple-600"
                                      ? "bg-purple-500/10"
                                      : "bg-muted",
                          )}
                        >
                          <metric.icon className={cn("h-4 w-4", metric.color)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* View Tabs and Filters */}
          <div className="px-6 pb-3">
            <div className="flex items-center justify-between gap-4">
              {/* View Tabs */}
              <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
                <TabsList className="bg-muted/50 p-1 h-9">
                  <TabsTrigger value="board" className="gap-2 text-xs px-3 data-[state=active]:bg-background">
                    <Kanban className="h-3.5 w-3.5" />
                    Board
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2 text-xs px-3 data-[state=active]:bg-background">
                    <List className="h-3.5 w-3.5" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="table" className="gap-2 text-xs px-3 data-[state=active]:bg-background">
                    <Table className="h-3.5 w-3.5" />
                    Table
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="gap-2 text-xs px-3 data-[state=active]:bg-background">
                    <GanttChart className="h-3.5 w-3.5" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2 text-xs px-3 data-[state=active]:bg-background">
                    <Calendar className="h-3.5 w-3.5" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-2 text-xs px-3 data-[state=active]:bg-background">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search and Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    className="pl-9 w-48 h-9 bg-muted/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9 bg-transparent">
                      <Filter className="h-4 w-4" />
                      Filter
                      {(statusFilter.length > 0 || priorityFilter.length > 0) && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {statusFilter.length + priorityFilter.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {statuses.map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status.id}
                            checked={statusFilter.includes(status.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setStatusFilter([...statusFilter, status.id])
                              } else {
                                setStatusFilter(statusFilter.filter((s) => s !== status.id))
                              }
                            }}
                          >
                            <status.icon className="h-4 w-4 mr-2" style={{ color: status.color }} />
                            {status.name}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {priorities.map((priority) => (
                          <DropdownMenuCheckboxItem
                            key={priority.id}
                            checked={priorityFilter.includes(priority.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPriorityFilter([...priorityFilter, priority.id])
                              } else {
                                setPriorityFilter(priorityFilter.filter((p) => p !== priority.id))
                              }
                            }}
                          >
                            <priority.icon className="h-4 w-4 mr-2" style={{ color: priority.color }} />
                            {priority.name}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter([])
                        setPriorityFilter([])
                      }}
                    >
                      Clear all filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9 bg-transparent">
                      <Layers className="h-4 w-4" />
                      Group: {groupBy}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setGroupBy("status")}>Status</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy("priority")}>Priority</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy("assignee")}>Assignee</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy("label")}>Label</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {activeView === "board" && (
              <EnterpriseKanbanBoard
                tasks={filteredTasks}
                statuses={statuses}
                priorities={priorities}
                labels={labels}
                onTaskClick={handleTaskClick}
                groupBy={groupBy}
                compactMode={compactMode}
              />
            )}
            {activeView === "list" && (
              <EnterpriseListView
                tasks={filteredTasks}
                statuses={statuses}
                priorities={priorities}
                onTaskClick={handleTaskClick}
              />
            )}
            {activeView === "table" && (
              <EnterpriseTableView
                tasks={filteredTasks}
                statuses={statuses}
                priorities={priorities}
                onTaskClick={handleTaskClick}
              />
            )}
            {activeView === "analytics" && <ProjectAnalyticsView metrics={projectMetrics} tasks={filteredTasks} />}
          </div>
        </ScrollArea>
      </main>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        taskId={selectedTask?.id || null}
        projectId={projectId}
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
      />

      {/* Customize Dialog (Notion-like) */}
      <Dialog open={customizeDialogOpen} onOpenChange={setCustomizeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Customize Project
            </DialogTitle>
            <DialogDescription>Personalize how this project looks and feels.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProjectCover("/placeholder.svg?height=400&width=1200")}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add cover
                </Button>
                {projectCover && (
                  <Button variant="outline" size="sm" onClick={() => setProjectCover(null)}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Options</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show description</p>
                    <p className="text-xs text-muted-foreground">Display project description in header</p>
                  </div>
                  <Switch checked={showDescription} onCheckedChange={setShowDescription} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show metrics</p>
                    <p className="text-xs text-muted-foreground">Display metrics cards in header</p>
                  </div>
                  <Switch checked={showMetrics} onCheckedChange={setShowMetrics} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Compact mode</p>
                    <p className="text-xs text-muted-foreground">Use smaller cards and spacing</p>
                  </div>
                  <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCustomizeDialogOpen(false)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create Dialog */}
      <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Issue title..."
                value={quickCreateTitle}
                onChange={(e) => setQuickCreateTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={quickCreateStatus} onValueChange={setQuickCreateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <status.icon className="h-4 w-4" style={{ color: status.color }} />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id}>
                        <div className="flex items-center gap-2">
                          <priority.icon className="h-4 w-4" style={{ color: priority.color }} />
                          {priority.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Add a description..." className="min-h-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickCreate}>Create Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Enterprise Kanban Board Component
function EnterpriseKanbanBoard({
  tasks,
  statuses,
  priorities,
  labels,
  onTaskClick,
  groupBy,
  compactMode,
}: {
  tasks: Task[]
  statuses: { id: string; name: string; color: string; icon: any }[]
  priorities: { id: string; name: string; color: string; icon: any }[]
  labels: { id: string; name: string; color: string; icon: any }[]
  onTaskClick: (task: Task) => void
  groupBy: string
  compactMode: boolean
}) {
  const getGroupedTasks = () => {
    if (groupBy === "status") {
      return statuses.map((status) => ({
        ...status,
        tasks: tasks.filter((t) => t.status === status.id),
      }))
    }
    if (groupBy === "priority") {
      return priorities.map((priority) => ({
        ...priority,
        tasks: tasks.filter((t) => t.priority === priority.id),
      }))
    }
    return statuses.map((status) => ({
      ...status,
      tasks: tasks.filter((t) => t.status === status.id),
    }))
  }

  const groups = getGroupedTasks()

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {groups.map((group) => (
        <div key={group.id} className="flex-shrink-0 w-80 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <group.icon className="h-4 w-4" style={{ color: group.color }} />
              <h3 className="font-semibold text-sm">{group.name}</h3>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {group.tasks.length}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {group.tasks.map((task) => (
              <Card
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={cn(
                  "cursor-pointer hover:shadow-md transition-all border-l-4 group",
                  compactMode ? "p-2" : "p-3",
                )}
                style={{ borderLeftColor: priorities.find((p) => p.id === task.priority)?.color || "#6B7280" }}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={cn("font-medium line-clamp-2", compactMode ? "text-xs" : "text-sm")}>
                      {task.title}
                    </h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {!compactMode && task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        TSK-{task.id.split("-")[1]?.slice(0, 4).toUpperCase()}
                      </span>
                      {task.dueDate && (
                        <span
                          className={cn(
                            "text-xs flex items-center gap-1",
                            new Date(task.dueDate) < new Date() ? "text-red-600" : "text-muted-foreground",
                          )}
                        >
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <div className="flex -space-x-1.5">
                      {task.assignees?.slice(0, 3).map((userId) => {
                        const user = mockUsers.find((u) => u.id === userId)
                        return (
                          <Avatar key={userId} className="h-5 w-5 border-2 border-background">
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                            <AvatarFallback className="text-[10px]">{user?.name?.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="ghost"
            className="w-full mt-2 justify-start text-muted-foreground hover:text-foreground text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add issue
          </Button>
        </div>
      ))}

      <Button
        variant="ghost"
        className="flex-shrink-0 w-64 h-12 border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add status
      </Button>
    </div>
  )
}

// Enterprise List View Component
function EnterpriseListView({
  tasks,
  statuses,
  priorities,
  onTaskClick,
}: {
  tasks: Task[]
  statuses: { id: string; name: string; color: string; icon: any }[]
  priorities: { id: string; name: string; color: string; icon: any }[]
  onTaskClick: (task: Task) => void
}) {
  return (
    <div className="space-y-1">
      {tasks.map((task) => {
        const status = statuses.find((s) => s.id === task.status)
        const priority = priorities.find((p) => p.id === task.priority)

        return (
          <div
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
          >
            <Checkbox className="h-4 w-4" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  TSK-{task.id.split("-")[1]?.slice(0, 4).toUpperCase()}
                </span>
                <h4 className="font-medium text-sm truncate">{task.title}</h4>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {status && (
                <Badge variant="outline" className="text-xs" style={{ borderColor: status.color, color: status.color }}>
                  <status.icon className="h-3 w-3 mr-1" />
                  {status.name}
                </Badge>
              )}

              {priority && <priority.icon className="h-4 w-4" style={{ color: priority.color }} />}

              {task.dueDate && (
                <span
                  className={cn(
                    "text-xs",
                    new Date(task.dueDate) < new Date() ? "text-red-600" : "text-muted-foreground",
                  )}
                >
                  {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}

              <div className="flex -space-x-1.5">
                {task.assignees?.slice(0, 2).map((userId) => {
                  const user = mockUsers.find((u) => u.id === userId)
                  return (
                    <Avatar key={userId} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                      <AvatarFallback className="text-[10px]">{user?.name?.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  )
                })}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Enterprise Table View Component
function EnterpriseTableView({
  tasks,
  statuses,
  priorities,
  onTaskClick,
}: {
  tasks: Task[]
  statuses: { id: string; name: string; color: string; icon: any }[]
  priorities: { id: string; name: string; color: string; icon: any }[]
  onTaskClick: (task: Task) => void
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium w-8">
              <Checkbox />
            </th>
            <th className="px-4 py-3 font-medium">Issue</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Due Date</th>
            <th className="px-4 py-3 font-medium w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tasks.map((task) => {
            const status = statuses.find((s) => s.id === task.status)
            const priority = priorities.find((p) => p.id === task.priority)
            const assignee = mockUsers.find((u) => task.assignees?.includes(u.id))

            return (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <Checkbox onClick={(e) => e.stopPropagation()} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      TSK-{task.id.split("-")[1]?.slice(0, 4).toUpperCase()}
                    </span>
                    <span className="font-medium text-sm truncate max-w-md">{task.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {status && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: status.color, color: status.color }}
                    >
                      <status.icon className="h-3 w-3 mr-1" />
                      {status.name}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {priority && (
                    <div className="flex items-center gap-1.5">
                      <priority.icon className="h-4 w-4" style={{ color: priority.color }} />
                      <span className="text-xs">{priority.name}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {assignee && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                        <AvatarFallback className="text-[10px]">{assignee.name?.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{assignee.name}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {task.dueDate && (
                    <span
                      className={cn(
                        "text-xs",
                        new Date(task.dueDate) < new Date() ? "text-red-600" : "text-muted-foreground",
                      )}
                    >
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Project Analytics View
function ProjectAnalyticsView({ metrics, tasks }: { metrics: any; tasks: Task[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Issues by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Backlog", value: metrics.backlog, color: "#6B7280" },
              { label: "To Do", value: metrics.todo, color: "#8B5CF6" },
              { label: "In Progress", value: metrics.inProgress, color: "#F59E0B" },
              { label: "In Review", value: metrics.inReview, color: "#3B82F6" },
              { label: "Done", value: metrics.completed, color: "#10B981" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm flex-1">{item.label}</span>
                <span className="font-medium">{item.value}</span>
                <Progress value={metrics.total > 0 ? (item.value / metrics.total) * 100 : 0} className="w-24 h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Completion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <svg className="h-40 w-40 -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${metrics.completionRate * 4.4} 440`}
                  className="text-green-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-bold">{metrics.completionRate}%</span>
                <span className="text-sm text-muted-foreground">Complete</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { user: "John Doe", action: "completed", task: "Fix login bug", time: "2 hours ago" },
              { user: "Jane Smith", action: "created", task: "Add dark mode", time: "4 hours ago" },
              { user: "Mike Johnson", action: "commented on", task: "Update API docs", time: "5 hours ago" },
              { user: "Sarah Wilson", action: "assigned to", task: "Design review", time: "Yesterday" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{activity.user.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-muted-foreground"> {activity.action} </span>
                  <span className="font-medium">{activity.task}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
