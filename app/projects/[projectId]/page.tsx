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
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const { data: project, isLoading } = useProject(projectId)
  const { data: tasks } = useTasks(projectId)

  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [taskSheetOpen, setTaskSheetOpen] = React.useState(false)
  const [isStarred, setIsStarred] = React.useState(false)

  const projectMetrics = React.useMemo(() => {
    const taskList = tasks || []
    const total = taskList.length
    const completed = taskList.filter((t) => t.status === "done").length
    const inProgress = taskList.filter((t) => t.status === "in-progress").length
    const overdue = taskList.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length
    const highPriority = taskList.filter((t) => t.priority === "high").length

    return {
      total,
      completed,
      inProgress,
      overdue,
      highPriority,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
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
              </div>

              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsStarred(!isStarred)}>
                        <Star className={cn("h-4 w-4", isStarred && "fill-yellow-400 text-yellow-400")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Star project</TooltipContent>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
              </div>
            </div>

            {/* Project title and description */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                    <Badge variant={project.status === "active" ? "default" : "secondary"} className="capitalize">
                      {project.status || "Active"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
                    {project.description || "Manage tasks, track progress, and collaborate with your team"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total Tasks</p>
                      <p className="text-2xl font-bold">{projectMetrics.total}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{projectMetrics.completed}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">{projectMetrics.inProgress}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{projectMetrics.overdue}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Completion</p>
                      <p className="text-2xl font-bold">{projectMetrics.completionRate}%</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <Progress value={projectMetrics.completionRate} className="h-1 mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">High Priority</p>
                      <p className="text-2xl font-bold text-orange-600">{projectMetrics.highPriority}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
