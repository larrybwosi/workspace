"use client"

import * as React from "react"
import { Plus, MoreHorizontal, Calendar, MessageSquare, LinkIcon, CheckSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { mockUsers } from "@/lib/mock-data"
import type { Task } from "@/lib/types"

interface KanbanColumn {
  id: string
  title: string
  color: string
  tasks: Task[]
}

const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Design Homepage Wireframe",
    description: "Discuss layout with the marketing team for alignm...",
    status: "todo",
    priority: "low",
    dueDate: new Date("2023-11-02"),
    assignees: ["user-2", "user-3"],
    linkedChannels: [],
    linkedMessages: [],
    comments: 12,
    links: 1,
    progress: { completed: 0, total: 3 },
  },
  {
    id: "task-2",
    title: "Design Homepage Wireframe",
    description: "Discuss layout with the marketing team for alignm...",
    status: "in-progress",
    priority: "medium",
    dueDate: new Date("2023-11-02"),
    assignees: ["user-1", "user-4"],
    linkedChannels: [],
    linkedMessages: [],
    comments: 12,
    links: 1,
    progress: { completed: 0, total: 3 },
  },
  {
    id: "task-3",
    title: "Design Homepage Wireframe",
    description: "Discuss layout with the marketing team for alignm...",
    status: "done",
    priority: "high",
    dueDate: new Date("2023-11-02"),
    assignees: ["user-2", "user-5"],
    linkedChannels: [],
    linkedMessages: [],
    comments: 12,
    links: 1,
    progress: { completed: 0, total: 3 },
  },
]

interface KanbanBoardProps {
  onTaskClick?: (task: Task) => void
  onCreateTask?: (status: Task["status"]) => void
}

export function KanbanBoard({ onTaskClick, onCreateTask }: KanbanBoardProps) {
  const [columns, setColumns] = React.useState<KanbanColumn[]>([
    {
      id: "todo",
      title: "To do",
      color: "bg-yellow-500",
      tasks: mockTasks.filter((t) => t.status === "todo"),
    },
    {
      id: "in-progress",
      title: "In Progress",
      color: "bg-blue-500",
      tasks: mockTasks.filter((t) => t.status === "in-progress"),
    },
    {
      id: "done",
      title: "Done",
      color: "bg-pink-500",
      tasks: mockTasks.filter((t) => t.status === "done"),
    },
  ])

  const [draggedTask, setDraggedTask] = React.useState<Task | null>(null)
  const [draggedFromColumn, setDraggedFromColumn] = React.useState<string | null>(null)

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggedTask(task)
    setDraggedFromColumn(columnId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask || !draggedFromColumn) return

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === draggedFromColumn) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== draggedTask.id),
          }
        }
        if (col.id === targetColumnId) {
          const updatedTask = {
            ...draggedTask,
            status: targetColumnId as Task["status"],
          }
          return {
            ...col,
            tasks: [...col.tasks, updatedTask],
          }
        }
        return col
      }),
    )

    setDraggedTask(null)
    setDraggedFromColumn(null)
  }

  const handleDuplicateTask = (task: Task, columnId: string) => {
    const newTask = {
      ...task,
      id: `task-${Date.now()}`,
      title: `${task.title} (Copy)`,
    }

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: [...col.tasks, newTask],
          }
        }
        return col
      }),
    )
  }

  const handleDeleteTask = (taskId: string, columnId: string) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          }
        }
        return col
      }),
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
      case "medium":
        return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
      case "low":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
      case "in-progress":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
      case "todo":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done":
        return "Complete"
      case "in-progress":
        return "In Research"
      case "todo":
        return "Not Started"
      default:
        return status
    }
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className="shrink-0 w-80 flex flex-col"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", column.color)} />
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {column.tasks.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onCreateTask?.(column.id as Task["status"])}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {column.tasks.map((task) => (
              <Card
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task, column.id)}
                onClick={() => onTaskClick?.(task)}
                className="p-4 hover:shadow-md transition-shadow cursor-move"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className={cn("text-xs font-medium", getStatusColor(task.status))}>
                      {getStatusLabel(task.status)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onTaskClick?.(task)
                          }}
                        >
                          Edit task
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateTask(task, column.id)
                          }}
                        >
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>Archive</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTask(task.id, column.id)
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Assignees :</div>
                    <div className="flex -space-x-2">
                      {task.assignees.map((userId) => {
                        const user = mockUsers.find((u) => u.id === userId)
                        return (
                          <Avatar key={userId} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                            <AvatarFallback className="text-xs">{user?.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {task.dueDate.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {task.comments} Comments
                    </div>
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-3.5 w-3.5" />
                      {task.links} Links
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckSquare className="h-3.5 w-3.5" />
                      {task.progress.completed}/{task.progress.total}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="ghost"
            className="w-full mt-3 justify-start text-muted-foreground hover:text-foreground"
            onClick={() => onCreateTask?.(column.id as Task["status"])}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        </div>
      ))}

      <Button
        variant="ghost"
        className="shrink-0 w-64 h-12 border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add column
      </Button>
    </div>
  )
}
