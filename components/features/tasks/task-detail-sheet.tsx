"use client"

import * as React from "react"
import { Clock, Share, MoreHorizontal, Calendar, Tag, Users, Edit, LinkIcon, MessageSquare, Activity, FileText, Zap, GitBranch, Target, History, Bell, Copy, ExternalLink, BarChart3, AlertTriangle, Plus, Play, Pause, CheckSquare, Trash2, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskCreateEditDialog } from "./task-create-edit-dialog"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox" // Added
import type { Task } from "@/lib/types"
import { mockUsers, mockTasks } from "@/lib/mock-data" // mockTasks added
import { Card } from "@/components/ui/card"
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useTaskSubtasks,
  useCreateSubtask,
  useTaskTimeEntries,
  useStartTimer,
  useStopTimer,
  useTaskComments,
  useCreateTaskComment,
  useAddTaskDependency,
  useRemoveTaskDependency,
} from "@/hooks/api/use-tasks"
import { toast } from "sonner"
import { WatcherManagementDialog } from "./watcher-management-dialog"

interface Subtask {
  id: string
  title: string
  completed: boolean
  assigneeId?: string
  dueDate?: Date
}

interface TimeEntry {
  id: string
  userId: string
  duration: number
  startTime: Date
  endTime: Date
  description: string
}

interface TaskActivity {
  id: string
  userId: string
  action: string
  details: string
  timestamp: Date
  type: "status" | "comment" | "file" | "assignment" | "reaction" | "time" | "progress"
  fileUrl?: string
  fileSize?: string
}

interface TaskDetailSheetProps {
  taskId: string | null // Changed from task to taskId
  projectId: string // Added projectId
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailSheet({ taskId, projectId, open, onOpenChange }: TaskDetailSheetProps) {
  const { data: task, isLoading } = useTask(taskId || "")
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()
  const { data: subtasks = [], refetch: refetchSubtasks } = useTaskSubtasks(taskId || "")
  const createSubtaskMutation = useCreateSubtask()
  const { data: timeEntries = [] } = useTaskTimeEntries(taskId || "")
  const startTimerMutation = useStartTimer()
  const stopTimerMutation = useStopTimer()
  const { data: comments = [] } = useTaskComments(taskId || "")
  const createCommentMutation = useCreateTaskComment()
  const addDependencyMutation = useAddTaskDependency()
  const removeDependencyMutation = useRemoveTaskDependency()

  const [comment, setComment] = React.useState("")
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [isTracking, setIsTracking] = React.useState(false)
  const [trackingTime, setTrackingTime] = React.useState(0)
  const [currentTimerId, setCurrentTimerId] = React.useState<string | null>(null)

  const [estimatedHours, setEstimatedHours] = React.useState(task?.estimatedHours?.toString() || "8")
  const [loggedHours, setLoggedHours] = React.useState(task?.loggedHours || 0)

  // Moved subtasks state to be fetched from API
  // const [subtasks, setSubtasks] = React.useState<Subtask[]>([ ... ])
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("")
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false)

  // Moved timeEntries state to be fetched from API
  // const [timeEntries, setTimeEntries] = React.useState<TimeEntry[]>([ ... ])

  const [activities] = React.useState<TaskActivity[]>([
    {
      id: "act-1",
      userId: "user-3",
      action: "changed the status of",
      details: `"${task?.title || "task"}" from To Do to In Progress`,
      timestamp: new Date(Date.now() - 3600000),
      type: "status",
    },
    {
      id: "act-2",
      userId: "user-2",
      action: "logged 2 hours on",
      details: task?.title || "task",
      timestamp: new Date(Date.now() - 7200000),
      type: "time",
    },
    {
      id: "act-3",
      userId: "user-3",
      action: "updated progress to 60% on",
      details: task?.title || "task",
      timestamp: new Date(Date.now() - 10800000),
      type: "progress",
    },
  ])

  const [watchers, setWatchers] = React.useState<string[]>(["user-1", "user-4"])

  const [blockers, setBlockers] = React.useState<Array<{ taskId: string; task?: Task }>>([])
  const [relatedTasks, setRelatedTasks] = React.useState<Array<{ taskId: string; task?: Task }>>([])

  const [linkTaskDialogOpen, setLinkTaskDialogOpen] = React.useState(false)
  const [blockerDialogOpen, setBlockerDialogOpen] = React.useState(false)
  const [linkType, setLinkType] = React.useState<"blocker" | "related">("related")
  const [searchTaskId, setSearchTaskId] = React.useState("") // Added

  const [watcherDialogOpen, setWatcherDialogOpen] = React.useState(false)

  const handleUpdateWatchers = (newWatchers: string[]) => {
    setWatchers(newWatchers)
    toast.success("Watchers updated")
    // TODO: Call API to update watchers
  }

  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTracking) {
      interval = setInterval(() => {
        setTrackingTime((prev) => prev + 1000)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking])

  React.useEffect(() => {
    if (task) {
      setEstimatedHours(task.estimatedHours?.toString() || "8")
      setLoggedHours(task.loggedHours || 0)
    }
  }, [task])

  const handleStartTracking = async () => {
    if (!taskId) return
    try {
      const result = await startTimerMutation.mutateAsync({
        taskId,
        userId: "user-1" // TODO: Get from auth context
      })
      setIsTracking(true)
      setCurrentTimerId(result.data.id)
      setTrackingTime(0)
      toast.success("Timer started")
    } catch (error) {
      toast.error("Failed to start timer")
    }
  }

  const handleStopTracking = async () => {
    if (!taskId || !currentTimerId) return
    try {
      await stopTimerMutation.mutateAsync({
        taskId,
        entryId: currentTimerId
      })
      setIsTracking(false)
      setCurrentTimerId(null)
      setTrackingTime(0)
      toast.success("Timer stopped and time logged")
      // Optionally refetch time entries to show the new entry
      // refetchTimeEntries();
    } catch (error) {
      toast.error("Failed to stop timer")
    }
  }

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !taskId) return
    try {
      await createSubtaskMutation.mutateAsync({
        taskId,
        projectId,
        title: newSubtaskTitle,
        description: "",
        status: "todo" as const,
        priority: "medium" as const,
        assignees: [],
        dueDate: new Date(),
        tags: [],
        linkedChannels: [],
        comments: 0,
        links: 0,
        progress: { completed: 0, total: 0 },
      })
      setNewSubtaskTitle("")
      setIsAddingSubtask(false)
      toast.success("Subtask created")
      refetchSubtasks() // Refetch subtasks after creation
    } catch (error) {
      toast.error("Failed to create subtask")
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId)
    if (!subtask || !taskId || !projectId) return

    try {
      await updateTaskMutation.mutateAsync({
        id: subtaskId,
        projectId,
        status: subtask.completed ? "todo" : "done", // Assuming subtasks have a status field similar to tasks
      })
      refetchSubtasks()
    } catch (error) {
      toast.error("Failed to update subtask")
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!taskId || !projectId) return
    try {
      await deleteTaskMutation.mutateAsync({ id: subtaskId, projectId })
      toast.success("Subtask deleted")
      refetchSubtasks() // Refetch subtasks after deletion
    } catch (error) {
      toast.error("Failed to delete subtask")
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim() || !taskId) return
    try {
      await createCommentMutation.mutateAsync({
        taskId,
        content: comment,
        userId: "user-1", // TODO: Get from auth context
      })
      setComment("")
      toast.success("Comment added")
      // Optionally refetch comments to display the new one
      // refetchComments();
    } catch (error) {
      toast.error("Failed to add comment")
    }
  }

  const handleAddBlocker = async (blockerTaskId: string) => {
    if (!taskId || !projectId) return
    try {
      await addDependencyMutation.mutateAsync({
        taskId,
        dependencyId: blockerTaskId,
        projectId,
      })
      const blockerTask = mockTasks.find((t) => t.id === blockerTaskId)
      setBlockers([...blockers, { taskId: blockerTaskId, task: blockerTask }])
      setBlockerDialogOpen(false)
      setSearchTaskId("")
      toast.success("Blocker added")
      // Optionally refetch dependencies
      // refetchDependencies();
    } catch (error) {
      toast.error("Failed to add blocker")
    }
  }

  const handleRemoveBlocker = async (blockerTaskId: string) => {
    if (!taskId || !projectId) return
    try {
      await removeDependencyMutation.mutateAsync({
        taskId,
        dependencyId: blockerTaskId,
        projectId,
      })
      toast.success("Blocker removed")
      // Optionally refetch dependencies
      // refetchDependencies();
    } catch (error) {
      toast.error("Failed to remove blocker")
    }
  }

  const handleStatusChange = async (newStatus: Task["status"]) => {
    if (!task || !projectId) return
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        projectId,
        status: newStatus,
      })
      toast.success("Status updated")
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handlePriorityChange = async (newPriority: Task["priority"]) => {
    if (!task || !projectId) return
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        projectId,
        priority: newPriority,
      })
      toast.success("Priority updated")
    } catch (error) {
      toast.error("Failed to update priority")
    }
  }

  const handleSaveTask = (taskData: Partial<Task>) => {
    console.log(" Saving edited task:", taskData)
    setEditDialogOpen(false)
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return "just now"
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return "Yesterday"
    return date.toLocaleDateString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "medium":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      case "low":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "in-progress":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "todo":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const completedSubtasks = subtasks.filter((s) => s.completed).length
  const totalSubtasks = subtasks.length
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0
  const timeProgress = (loggedHours / Number.parseFloat(estimatedHours)) * 100

  const handleAddRelatedTask = (taskId: string) => {
    const relatedTask = mockTasks.find((t) => t.id === taskId) // This mock lookup should be replaced with API call
    setRelatedTasks([...relatedTasks, { taskId, task: relatedTask }])
    setLinkTaskDialogOpen(false)
    setSearchTaskId("")
  }

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading task...</p>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!task) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="p-6 border-b space-y-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <SheetTitle className="text-xl font-semibold mb-2">{task.title}</SheetTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>TASK-{task.id.split("-")[1]?.toUpperCase()}</span>
                  <span>•</span>
                  <span>Created {formatTime(new Date())}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Copy link">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Open in new tab">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Share className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Prominent time tracking section */}
              <Card className="p-4 space-y-4 border-2 border-primary/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Tracking
                  </h3>
                  {!isTracking ? (
                    <Button onClick={handleStartTracking} size="sm" disabled={!taskId}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Timer
                    </Button>
                  ) : (
                    <Button onClick={handleStopTracking} size="sm" variant="destructive">
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Timer
                    </Button>
                  )}
                </div>
                {isTracking && (
                  <div className="text-center py-4">
                    <p className="text-4xl font-mono font-bold">{formatDuration(trackingTime)}</p>
                    <p className="text-sm text-muted-foreground mt-2">Time tracking in progress...</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Estimated</p>
                    <Input
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="h-8"
                      suffix="hrs"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Logged</p>
                    <p className="text-lg font-semibold">{loggedHours.toFixed(1)} hrs</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time Progress</span>
                    <span className="font-medium">{Math.round(timeProgress)}%</span>
                  </div>
                  <Progress value={timeProgress} className="h-2" />
                </div>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Subtasks
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {completedSubtasks} of {totalSubtasks} completed
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground">{Math.round(progressPercentage)}% complete</p>

                {/* Subtasks List */}
                <div className="space-y-2 mt-4">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox checked={subtask.completed} onCheckedChange={() => handleToggleSubtask(subtask.id)} />
                      <div className="flex-1">
                        <p className={`text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                          {subtask.title}
                        </p>
                        {subtask.assigneeId && (
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={mockUsers.find((u) => u.id === subtask.assigneeId)?.avatar || "/placeholder.svg"}
                                alt=""
                              />
                              <AvatarFallback className="text-xs">
                                {mockUsers.find((u) => u.id === subtask.assigneeId)?.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            {subtask.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                Due {subtask.dueDate.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask */}
                {isAddingSubtask ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Subtask title..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddSubtask()}
                      autoFocus
                      className="h-9"
                    />
                    <Button onClick={handleAddSubtask} size="sm" disabled={!newSubtaskTitle.trim() || createSubtaskMutation.isPending}>
                      {createSubtaskMutation.isPending ? "Adding..." : "Add"}
                    </Button>
                    <Button onClick={() => setIsAddingSubtask(false)} size="sm" variant="ghost">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 bg-transparent"
                    onClick={() => setIsAddingSubtask(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Subtask
                  </Button>
                )}
              </div>

              <Separator />

              {/* Watchers */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  <span>Watchers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {watchers.map((userId) => {
                      const user = mockUsers.find((u) => u.id === userId)
                      return (
                        <Avatar key={userId} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                          <AvatarFallback className="text-xs">{user?.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      )
                    })}
                  </div>
                  <Button variant="outline" size="sm" className="h-8 bg-transparent" onClick={() => setWatcherDialogOpen(true)}>
                    <Bell className="h-3 w-3 mr-1" />
                    Manage Watchers
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Blocked By</span>
                </div>
                {blockers.length > 0 ? (
                  <div className="space-y-2">
                    {blockers.map(({ taskId: blockerTaskId, task: blockerTask }) => (
                      <div key={blockerTaskId} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">TASK-{blockerTaskId.toUpperCase()}</span>
                            {blockerTask && (
                              <Badge variant="secondary" className={getStatusColor(blockerTask.status)}>
                                {blockerTask.status}
                              </Badge>
                            )}
                          </div>
                          {blockerTask && <p className="text-xs text-muted-foreground mt-1">{blockerTask.title}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 text-xs">
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleRemoveBlocker(blockerTaskId)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 bg-transparent"
                  onClick={() => {
                    setLinkType("blocker")
                    setBlockerDialogOpen(true)
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Blocker
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GitBranch className="h-4 w-4" />
                  <span>Related Tasks</span>
                </div>
                {relatedTasks.length > 0 ? (
                  <div className="space-y-2">
                    {relatedTasks.map(({ taskId: relatedTaskId, task: relatedTask }) => (
                      <div key={relatedTaskId} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">TASK-{relatedTaskId.toUpperCase()}</span>
                            {relatedTask && (
                              <Badge variant="secondary" className={getStatusColor(relatedTask.status)}>
                                {relatedTask.status}
                              </Badge>
                            )}
                          </div>
                          {relatedTask && <p className="text-xs text-muted-foreground mt-1">{relatedTask.title}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 text-xs">
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setRelatedTasks(relatedTasks.filter((r) => r.taskId !== relatedTaskId))} // This should ideally be an API call
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 bg-transparent"
                  onClick={() => {
                    setLinkType("related")
                    setLinkTaskDialogOpen(true)
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Link Related Task
                </Button>
              </div>

              <Separator />

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    </div>
                    <span>Status</span>
                  </div>
                  <Select value={task.status} onValueChange={(v) => handleStatusChange(v as Task["status"])}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Priority</span>
                  </div>
                  <Select value={task.priority} onValueChange={(v) => handlePriorityChange(v as Task["priority"])}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due Date</span>
                  </div>
                  <Input type="date" defaultValue={task.dueDate.toISOString().split("T")[0]} className="h-9" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Sprint</span>
                  </div>
                  <Select defaultValue="sprint-1">
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sprint-1">Sprint 1</SelectItem>
                      <SelectItem value="sprint-2">Sprint 2</SelectItem>
                      <SelectItem value="backlog">Backlog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Assignees */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Assignees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {task.assignees.map((userId) => {
                      const user = mockUsers.find((u) => u.id === userId)
                      return (
                        <Avatar key={userId} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                          <AvatarFallback className="text-xs">{user?.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      )
                    })}
                  </div>
                  <Button variant="outline" size="sm" className="h-8 bg-transparent">
                    <Users className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>Labels</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="mr-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
