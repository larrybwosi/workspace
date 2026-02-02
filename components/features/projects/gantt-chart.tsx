"use client"
import * as React from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { mockUsers } from "@/lib/mock-data"
import { ChevronRight, ChevronDown, AlertCircle, CheckCircle, Target } from "lucide-react"

interface GanttTask {
  id: string
  title: string
  startDate: Date
  endDate: Date
  progress: number
  status: Task["status"]
  assignees: string[]
  dependencies?: string[]
}

interface GanttChartProps {
  tasks: GanttTask[]
  onTaskClick?: (taskId: string) => void
}

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const [viewMode, setViewMode] = React.useState<"day" | "week" | "month">("week")
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set())
  const [showDependencies, setShowDependencies] = React.useState(true)
  const [showMilestones, setShowMilestones] = React.useState(true)

  const startDate = React.useMemo(() => {
    if (tasks.length === 0) return new Date()
    const dates = tasks.map((t) => t.startDate.getTime())
    const minDate = new Date(Math.min(...dates))
    // Start from the beginning of the month for better view
    minDate.setDate(1)
    return minDate
  }, [tasks])

  const endDate = React.useMemo(() => {
    if (tasks.length === 0) {
      const end = new Date(startDate)
      end.setMonth(end.getMonth() + 3)
      return end
    }
    const dates = tasks.map((t) => t.endDate.getTime())
    const maxDate = new Date(Math.max(...dates))
    // Add some padding for better visualization
    maxDate.setDate(maxDate.getDate() + 14)
    return maxDate
  }, [tasks, startDate])

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const columns =
    viewMode === "day" ? totalDays : viewMode === "week" ? Math.ceil(totalDays / 7) : Math.ceil(totalDays / 30)

  const milestones = React.useMemo(() => {
    return tasks
      .filter((task) => task.status === "done" && task.progress === 100)
      .map((task) => ({
        id: task.id,
        title: task.title,
        date: task.endDate,
      }))
  }, [tasks])

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = Math.max(0, Math.ceil((task.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    const taskDuration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24))

    const divisor = viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30
    const left = (taskStart / divisor) * 120
    const width = Math.max((taskDuration / divisor) * 120, 40)

    return { left, width }
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return "bg-green-500"
      case "in-progress":
        return "bg-blue-500"
      default:
        return "bg-gray-400"
    }
  }

  const formatDateHeader = (index: number) => {
    const date = new Date(startDate)
    if (viewMode === "day") {
      date.setDate(date.getDate() + index)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else if (viewMode === "week") {
      date.setDate(date.getDate() + index * 7)
      return `Week ${Math.ceil(index + 1)}`
    } else {
      date.setMonth(date.getMonth() + index)
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    }
  }

  const getDependencyLine = (fromTask: GanttTask, toTask: GanttTask) => {
    const from = getTaskPosition(fromTask)
    const to = getTaskPosition(toTask)
    return {
      x1: from.left + from.width,
      y1: tasks.indexOf(fromTask) * 48 + 24,
      x2: to.left,
      y2: tasks.indexOf(toTask) * 48 + 24,
    }
  }

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Timeline View</h2>
          <p className="text-sm text-muted-foreground">Visualize project timeline with dependencies and milestones</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={viewMode === "day" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setViewMode("day")}
          >
            Day
          </Badge>
          <Badge
            variant={viewMode === "week" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setViewMode("week")}
          >
            Week
          </Badge>
          <Badge
            variant={viewMode === "month" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setViewMode("month")}
          >
            Month
          </Badge>
          <Button
            variant={showDependencies ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDependencies(!showDependencies)}
          >
            Dependencies
          </Button>
          <Button
            variant={showMilestones ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMilestones(!showMilestones)}
          >
            Milestones
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex">
          {/* Task list */}
          <div className="w-80 border-r border-border pr-4 space-y-0">
            <div className="h-12 flex items-center font-semibold text-sm border-b border-border mb-2">
              <span className="flex-1">Task Name</span>
              <span className="w-20 text-center">Progress</span>
            </div>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="h-12 flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 transition-colors border-b border-border/50"
                onClick={() => onTaskClick?.(task.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(task.id)
                  }}
                  className="p-1"
                >
                  {expandedTasks.has(task.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>

                {/* Status indicator */}
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      task.status === "done" ? "#22c55e" : task.status === "in-progress" ? "#3b82f6" : "#9ca3af",
                  }}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex -space-x-1">
                      {task.assignees.slice(0, 2).map((userId) => {
                        const user = mockUsers.find((u) => u.id === userId)
                        return (
                          <Avatar key={userId} className="h-4 w-4 border border-background">
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                            <AvatarFallback className="text-[8px]">{user?.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                        )
                      })}
                    </div>
                    {task.dependencies && task.dependencies.length > 0 && (
                      <AlertCircle
                        className="h-3 w-3 text-orange-500"
                        title={`${task.dependencies.length} dependencies`}
                      />
                    )}
                  </div>
                </div>

                <div className="w-20 text-center">
                  <span className="text-xs font-medium">{task.progress}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <ScrollArea className="flex-1">
            <div className="min-w-max">
              {/* Timeline header */}
              <div className="flex h-12 border-b border-border mb-2">
                {Array.from({ length: columns }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[120px] flex flex-col items-center justify-center text-xs font-medium border-r border-border"
                  >
                    <span>{formatDateHeader(i)}</span>
                  </div>
                ))}
              </div>

              {/* Timeline bars */}
              <div className="relative">
                {showDependencies && (
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: columns * 120, height: tasks.length * 48 }}
                  >
                    {tasks.map((task) =>
                      task.dependencies?.map((depId) => {
                        const depTask = tasks.find((t) => t.id === depId)
                        if (!depTask) return null
                        const line = getDependencyLine(depTask, task)
                        return (
                          <g key={`${task.id}-${depId}`}>
                            <line
                              x1={line.x1}
                              y1={line.y1}
                              x2={line.x2}
                              y2={line.y2}
                              stroke="#9ca3af"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                            />
                            <circle cx={line.x2} cy={line.y2} r="3" fill="#9ca3af" />
                          </g>
                        )
                      }),
                    )}
                  </svg>
                )}

                {tasks.map((task, index) => {
                  const { left, width } = getTaskPosition(task)
                  const isOverdue = task.status !== "done" && task.endDate < new Date()

                  return (
                    <div key={task.id} className="h-12 border-b border-border/50 relative">
                      {/* Grid lines */}
                      {Array.from({ length: columns }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 w-[120px] border-r border-border/30"
                          style={{ left: i * 120 }}
                        />
                      ))}

                      {/* Task bar */}
                      <div
                        className={cn(
                          "absolute top-2 h-8 rounded-md cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2 gap-2",
                          getStatusColor(task.status),
                          isOverdue && "ring-2 ring-red-500",
                        )}
                        style={{ left: `${left}px`, width: `${width}px` }}
                        onClick={() => onTaskClick?.(task.id)}
                      >
                        {/* Progress indicator */}
                        <div
                          className="absolute inset-0 bg-white/20 rounded-md transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                        <span className="relative text-xs font-medium text-white truncate flex items-center gap-1">
                          {task.status === "done" && <CheckCircle className="h-3 w-3" />}
                          {task.title}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {showMilestones &&
                  milestones.map((milestone) => {
                    const daysSinceStart = Math.ceil(
                      (milestone.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
                    )
                    const divisor = viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30
                    const left = (daysSinceStart / divisor) * 120

                    return (
                      <div
                        key={milestone.id}
                        className="absolute top-0 bottom-0 w-0.5 bg-green-500 pointer-events-none"
                        style={{ left: `${left}px` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <Target className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium text-green-600 whitespace-nowrap">
                            {milestone.title}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-gray-400" />
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded ring-2 ring-red-500" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-green-500" />
            <span>Milestone</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-0.5 w-6 bg-gray-400"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #9ca3af 0, #9ca3af 4px, transparent 4px, transparent 8px)",
              }}
            />
            <span>Dependency</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
