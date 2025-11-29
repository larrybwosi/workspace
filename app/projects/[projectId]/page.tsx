"use client"

import * as React from "react"
import { Sidebar } from "@/components/sidebar"
import { TaskManagementView } from "@/components/task-management-view"
import { TaskDetailSheet } from "@/components/task-detail-sheet"
import { useParams, useRouter } from "next/navigation"
import type { Task } from "@/lib/types"
import { useProject } from "@/hooks/api/use-projects"
import { useTasks } from "@/hooks/api/use-tasks"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  Zap,
  Star,
  Bell,
  Settings,
  Share2,
  Plus,
  Activity,
  Clock,
  Calendar,
  MoreHorizontal,
  Download,
  Upload,
  Copy,
  Archive,
  Trash2,
  Link,
  Mail,
  MessageSquare,
  Video,
  Phone,
  GitBranch,
  Lock,
  Eye,
  EyeOff,
  Bookmark,
  RefreshCw,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { mockUsers } from "@/lib/mock-data"

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
  const [activeView, setActiveView] = React.useState("overview")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showMetrics, setShowMetrics] = React.useState(true)

  const projectMetrics = React.useMemo(() => {
    const taskList = tasks || []
    const total = taskList.length
    const completed = taskList.filter((t) => t.status === "done").length
    const inProgress = taskList.filter((t) => t.status === "in-progress").length
    const todo = taskList.filter((t) => t.status === "todo").length
    const overdue = taskList.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length
    const highPriority = taskList.filter((t) => t.priority === "high").length
    const blockedTasks = taskList.filter((t) => t.status === "blocked").length
    const dueThisWeek = taskList.filter((t) => {
      if (!t.dueDate) return false
      const dueDate = new Date(t.dueDate)
      const today = new Date()
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      return dueDate >= today && dueDate <= weekFromNow && t.status !== "done"
    }).length

    const totalEstimatedHours = taskList.reduce((acc, t) => acc + (t.estimatedHours || 0), 0)
    const totalLoggedHours = taskList.reduce((acc, t) => acc + (t.loggedHours || 0), 0)

    return {
      total,
      completed,
      inProgress,
      todo,
      overdue,
      highPriority,
      blockedTasks,
      dueThisWeek,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      velocity: total > 0 ? Math.round((completed / Math.max(1, total - todo)) * 100) : 0,
      totalEstimatedHours,
      totalLoggedHours,
      hoursUtilization: totalEstimatedHours > 0 ? Math.round((totalLoggedHours / totalEstimatedHours) * 100) : 0,
    }
  }, [tasks])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setTaskSheetOpen(true)
  }

  const handleChannelSelect = (channelId: string) => {
    if (channelId === "assistant") {
      router.push("/assistant")
    } else if (channelId.startsWith("project-")) {
      router.push(`/projects/${channelId}`)
    } else if (channelId.startsWith("dm-") || channelId.startsWith("task-")) {
      router.push(`/channels/${channelId}`)
    } else {
      router.push(`/channels/${channelId}`)
    }
  }

  const handleBackClick = () => {
    router.push("/")
  }

  const handleExport = (format: string) => {
    toast.success(`Exporting project as ${format}...`)
  }

  const handleArchive = () => {
    toast.success("Project archived successfully")
  }

  const handleDuplicate = () => {
    toast.success("Project duplicated successfully")
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

      <main className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            {/* Top row with navigation and actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setSidebarOpen(true)}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
                <nav className="flex items-center gap-2 text-sm">
                  <button
                    onClick={handleBackClick}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Projects
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-medium text-foreground">{project.name}</span>
                </nav>
                {project.status === "active" && (
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                    Active
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsStarred(!isStarred)}>
                        <Star className={cn("h-4 w-4", isStarred && "fill-yellow-400 text-yellow-400")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isStarred ? "Unstar project" : "Star project"}</TooltipContent>
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
                    <TooltipContent>{isWatching ? "Stop watching" : "Watch project"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Notifications</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="gap-2">
                      <Link className="h-4 w-4" />
                      Copy project link
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Mail className="h-4 w-4" />
                      Share via email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2">
                      <Users className="h-4 w-4" />
                      Manage access
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Lock className="h-4 w-4" />
                      Make private
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="gap-2" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={handleDuplicate}>
                      <Copy className="h-4 w-4" />
                      Duplicate project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleExport("CSV")}>Export as CSV</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("JSON")}>Export as JSON</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("PDF")}>Export as PDF</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("Excel")}>Export as Excel</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem className="gap-2">
                      <Upload className="h-4 w-4" />
                      Import tasks
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2">
                      <GitBranch className="h-4 w-4" />
                      Create from template
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Bookmark className="h-4 w-4" />
                      Save as template
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2" onClick={handleArchive}>
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

            {/* Project title and description */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-2xl">
                  {project.icon || "📁"}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                    <Badge variant="outline" className="capitalize">
                      {project.status || "Active"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 max-w-xl line-clamp-1">
                    {project.description || "Manage tasks, track progress, and collaborate with your team"}
                  </p>
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
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Video className="h-4 w-4" />
                      Meet
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Video className="h-4 w-4" />
                      Start video call
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Phone className="h-4 w-4" />
                      Start audio call
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Open project chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Users className="h-4 w-4" />
                  Invite
                </Button>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              </div>
            </div>

            {showMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total</p>
                        <p className="text-xl font-bold">{projectMetrics.total}</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Done</p>
                        <p className="text-xl font-bold text-green-600">{projectMetrics.completed}</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                        <p className="text-xl font-bold text-blue-600">{projectMetrics.inProgress}</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                        <p className="text-xl font-bold text-red-600">{projectMetrics.overdue}</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Due Soon</p>
                        <p className="text-xl font-bold text-amber-600">{projectMetrics.dueThisWeek}</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">High Priority</p>
                        <p className="text-xl font-bold text-orange-600">{projectMetrics.highPriority}</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Progress</p>
                        <p className="text-xl font-bold">{projectMetrics.completionRate}%</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <Progress value={projectMetrics.completionRate} className="h-1 mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Hours</p>
                        <p className="text-xl font-bold">
                          {projectMetrics.totalLoggedHours}/{projectMetrics.totalEstimatedHours}
                        </p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Timer className="h-4 w-4 text-cyan-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowMetrics(!showMetrics)}
              >
                {showMetrics ? "Hide metrics" : "Show metrics"}
              </Button>
            </div>
          </div>
        </div>

        {/* Task Management View */}
        <div className="flex-1 overflow-hidden">
          <TaskManagementView onTaskClick={handleTaskClick} projectId={projectId} />
        </div>
      </main>

      <TaskDetailSheet task={selectedTask} open={taskSheetOpen} onOpenChange={setTaskSheetOpen} />
    </div>
  )
}
