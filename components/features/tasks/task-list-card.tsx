"use client"

import { useState } from "react"
import { ChevronDown, MessageCircle, Eye, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { mockUsers } from "@/lib/mock-data"
import type { Task } from "@/lib/types"

interface TaskListCardProps {
  task: Task
  onClick?: () => void
}

export function TaskListCard({ task, onClick }: TaskListCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const assignees = task.assignees.map((id) => mockUsers.find((u) => u.id === id)).filter(Boolean)
  const progressPercent =
    task.progress.total > 0 ? Math.round((task.progress.completed / task.progress.total) * 100) : 0

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-500/10 text-green-700 border-green-500/20"
      case "in-progress":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20"
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:border-border/80 transition-colors">
      <div className="bg-linear-to-r from-gray-50 to-transparent dark:from-gray-900/50">
        {/* Header with icon and basic info */}
        <div className="flex items-start gap-4 p-4 border-b border-border/50">
          <div
            className={`shrink-0 w-12 h-12 rounded-lg ${getPriorityColor(task.priority)} flex items-center justify-center text-white font-semibold`}
          >
            {progressPercent}%
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-base truncate">{task.title}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="px-4 py-3 grid grid-cols-6 gap-4 text-xs border-b border-border/50 bg-muted/30">
          <div>
            <div className="text-muted-foreground font-medium mb-1">TASK DATE</div>
            <div className="font-semibold">
              {task.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground font-medium mb-1">START TIME</div>
            <div className="font-semibold">
              {task.dueDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground font-medium mb-1">PRIORITY</div>
            <Badge className={`${getPriorityColor(task.priority)} text-white border-0`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
          </div>
          <div>
            <div className="text-muted-foreground font-medium mb-1">STATUS</div>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {task.status.replace("-", " ")}
            </Badge>
          </div>
          <div>
            <div className="text-muted-foreground font-medium mb-1">PROGRESS</div>
            <div className="font-semibold">{progressPercent}%</div>
          </div>
          <div>
            <div className="text-muted-foreground font-medium mb-1">DURATION</div>
            <div className="font-semibold">{task.estimatedHours || 0}h</div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-4 grid grid-cols-3 gap-6">
          {/* Left column - Project & Contact */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Project</div>
              <div className="space-y-1">
                <div className="text-sm font-medium">{task.linkedChannels?.[0] || "Unassigned"}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Contact</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📞</span>
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📧</span>
                  <span>contact@example.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📍</span>
                  <span>123 Main St, City, State</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle column - Team */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Assignees</div>
              <div className="flex -space-x-2">
                {assignees.map(
                  (user) =>
                    user && (
                      <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    ),
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Duration</div>
              <div className="text-sm font-medium">{task.estimatedHours || 0} Hours</div>
            </div>
          </div>

          {/* Right column - Comments & Steps */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Comments</div>
              <Button variant="link" className="p-0 h-auto text-sm text-blue-600">
                <MessageCircle className="h-4 w-4 mr-1" />
                See {task.comments} Comments
              </Button>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Progress</div>
              <div className="space-y-2">
                <Progress value={progressPercent} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {task.progress.completed} of {task.progress.total} subtasks
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable section for notes */}
        {task.tags && task.tags.length > 0 && (
          <div className="px-4 py-3 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              Tags: {task.tags.join(", ")}
            </Button>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
        <span>Created {new Date(task.dueDate).toLocaleDateString()}</span>
        <Button variant="ghost" size="sm" onClick={onClick} className="gap-2 h-8">
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      </div>
    </div>
  )
}
