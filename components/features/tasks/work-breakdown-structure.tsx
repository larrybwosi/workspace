"use client"
import * as React from "react"
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  GripVertical,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { mockUsers } from "@/lib/mock-data"

interface WBSNode {
  id: string
  title: string
  type: "phase" | "deliverable" | "task" | "subtask"
  status: Task["status"]
  priority: Task["priority"]
  assignees: string[]
  progress: number
  startDate: Date
  endDate: Date
  children?: WBSNode[]
  dependencies?: string[]
}

interface WBSProps {
  projectId: string
  onTaskClick?: (taskId: string) => void
  onCreateTask?: (parentId: string, type: WBSNode["type"]) => void
}

export function WorkBreakdownStructure({ projectId, onTaskClick, onCreateTask }: WBSProps) {
  const [wbsData] = React.useState<WBSNode[]>([
    {
      id: "phase-1",
      title: "Project Planning & Research",
      type: "phase",
      status: "done",
      priority: "high",
      assignees: ["user-1", "user-2"],
      progress: 100,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
      children: [
        {
          id: "deliverable-1",
          title: "Requirements Documentation",
          type: "deliverable",
          status: "done",
          priority: "high",
          assignees: ["user-1"],
          progress: 100,
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-15"),
          children: [
            {
              id: "task-1",
              title: "Gather stakeholder requirements",
              type: "task",
              status: "done",
              priority: "high",
              assignees: ["user-1"],
              progress: 100,
              startDate: new Date("2024-01-01"),
              endDate: new Date("2024-01-05"),
            },
            {
              id: "task-2",
              title: "Create requirements document",
              type: "task",
              status: "done",
              priority: "medium",
              assignees: ["user-1"],
              progress: 100,
              startDate: new Date("2024-01-06"),
              endDate: new Date("2024-01-15"),
            },
          ],
        },
      ],
    },
    {
      id: "phase-2",
      title: "Design & Prototyping",
      type: "phase",
      status: "in-progress",
      priority: "high",
      assignees: ["user-2", "user-3"],
      progress: 65,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-03-15"),
      children: [
        {
          id: "deliverable-2",
          title: "UI/UX Design",
          type: "deliverable",
          status: "in-progress",
          priority: "high",
          assignees: ["user-2"],
          progress: 75,
          startDate: new Date("2024-02-01"),
          endDate: new Date("2024-02-28"),
          children: [
            {
              id: "task-3",
              title: "Create wireframes",
              type: "task",
              status: "done",
              priority: "high",
              assignees: ["user-2"],
              progress: 100,
              startDate: new Date("2024-02-01"),
              endDate: new Date("2024-02-10"),
            },
            {
              id: "task-4",
              title: "Design high-fidelity mockups",
              type: "task",
              status: "in-progress",
              priority: "high",
              assignees: ["user-2"],
              progress: 60,
              startDate: new Date("2024-02-11"),
              endDate: new Date("2024-02-28"),
              children: [
                {
                  id: "subtask-1",
                  title: "Homepage design",
                  type: "subtask",
                  status: "done",
                  priority: "high",
                  assignees: ["user-2"],
                  progress: 100,
                  startDate: new Date("2024-02-11"),
                  endDate: new Date("2024-02-15"),
                },
                {
                  id: "subtask-2",
                  title: "Dashboard design",
                  type: "subtask",
                  status: "in-progress",
                  priority: "high",
                  assignees: ["user-2"],
                  progress: 40,
                  startDate: new Date("2024-02-16"),
                  endDate: new Date("2024-02-28"),
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "phase-3",
      title: "Development",
      type: "phase",
      status: "todo",
      priority: "high",
      assignees: ["user-3", "user-4"],
      progress: 0,
      startDate: new Date("2024-03-16"),
      endDate: new Date("2024-06-30"),
      children: [],
    },
  ])

  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(
    new Set(["phase-1", "phase-2", "deliverable-2", "task-4"]),
  )

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    }
  }

  const getTypeColor = (type: WBSNode["type"]) => {
    switch (type) {
      case "phase":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      case "deliverable":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
      case "task":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const renderNode = (node: WBSNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const indentClass = `ml-${depth * 6}`

    return (
      <div key={node.id} className="space-y-1">
        <Card
          className={cn("p-3 hover:shadow-md transition-all cursor-pointer group", depth > 0 && "ml-6")}
          onClick={() => onTaskClick?.(node.id)}
        >
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

            {/* Expand/collapse button */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNode(node.id)
                }}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <div className="w-6" />
            )}

            {/* Status icon */}
            {getStatusIcon(node.status)}

            {/* Node info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cn("text-xs", getTypeColor(node.type))}>
                  {node.type}
                </Badge>
                <h4 className="font-medium truncate">{node.title}</h4>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {node.startDate.toLocaleDateString()} - {node.endDate.toLocaleDateString()}
                </span>
                <Badge variant="outline" className={cn("text-xs", getPriorityColor(node.priority))}>
                  {node.priority}
                </Badge>
              </div>
            </div>

            {/* Progress */}
            <div className="w-32">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-medium">{node.progress}%</span>
              </div>
              <Progress value={node.progress} className="h-1.5" />
            </div>

            {/* Assignees */}
            <div className="flex -space-x-2">
              {node.assignees.slice(0, 3).map((userId) => {
                const user = mockUsers.find((u) => u.id === userId)
                return (
                  <Avatar key={userId} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                    <AvatarFallback className="text-xs">{user?.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                )
              })}
              {node.assignees.length > 3 && (
                <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                  +{node.assignees.length - 3}
                </div>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onCreateTask?.(node.id, "task")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add subtask
                </DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">{node.children!.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Work Breakdown Structure</h2>
          <p className="text-sm text-muted-foreground">Hierarchical view of project deliverables and tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Expand All
          </Button>
          <Button variant="outline" size="sm">
            Collapse All
          </Button>
          <Button size="sm" onClick={() => onCreateTask?.("root", "phase")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Phase
          </Button>
        </div>
      </div>

      <div className="space-y-2">{wbsData.map((node) => renderNode(node))}</div>
    </div>
  )
}
