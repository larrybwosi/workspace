"use client"

import { useState, useMemo } from "react"
import { Filter, Users, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TaskListCard } from "./task-list-card"
import { mockTasks, mockUsers } from "@/lib/mock-data"
import type { Task } from "@/lib/types"

interface TaskListViewProps {
  onTaskClick?: (task: Task) => void
}

export function TaskListView({ onTaskClick }: TaskListViewProps) {
  const [filterAssignee, setFilterAssignee] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [showCompleted, setShowCompleted] = useState(false)
  const [groupBy, setGroupBy] = useState<"none" | "assignee" | "status" | "project">("none")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAndGroupedTasks = useMemo(() => {
    const filtered = mockTasks.filter((task) => {
      const matchesAssignee = filterAssignee === "all" || task.assignees.includes(filterAssignee)
      const matchesStatus = filterStatus === "all" || task.status === filterStatus
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority
      const matchesCompleted = showCompleted || task.status !== "done"
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesAssignee && matchesStatus && matchesPriority && matchesCompleted && matchesSearch
    })

    if (groupBy === "none") return { ungrouped: filtered }

    const grouped: Record<string, Task[]> = {}

    if (groupBy === "assignee") {
      filtered.forEach((task) => {
        task.assignees.forEach((assigneeId) => {
          const assignee = mockUsers.find((u) => u.id === assigneeId)
          const key = assignee?.name || "Unassigned"
          if (!grouped[key]) grouped[key] = []
          if (!grouped[key].includes(task)) grouped[key].push(task)
        })
      })
    } else if (groupBy === "status") {
      const statusOrder = { todo: 0, "in-progress": 1, done: 2 }
      filtered.forEach((task) => {
        const key = task.status.charAt(0).toUpperCase() + task.status.slice(1)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(task)
      })
    } else if (groupBy === "project") {
      filtered.forEach((task) => {
        const projectKey = task.linkedChannels?.[0] || "Other"
        if (!grouped[projectKey]) grouped[projectKey] = []
        grouped[projectKey].push(task)
      })
    }

    return grouped
  }, [filterAssignee, filterStatus, filterPriority, showCompleted, groupBy, searchQuery])

  const taskCount = Array.isArray(filteredAndGroupedTasks.ungrouped)
    ? filteredAndGroupedTasks.ungrouped.length
    : Object.values(filteredAndGroupedTasks).reduce((sum, tasks) => sum + tasks.length, 0)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10">
              <span className="text-xs font-semibold text-red-600">{taskCount}</span>
            </div>
            <span className="text-sm font-medium">Task List</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showCompleted ? "default" : "outline"}
              size="sm"
              className="gap-2 bg-transparent"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Show Completed Tasks
              <div
                className={`w-9 h-5 rounded-full transition-colors ${showCompleted ? "bg-blue-500" : "bg-gray-300"}`}
              />
            </Button>

            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-36 bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Everyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                {mockUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value="today" onValueChange={() => {}}>
              <SelectTrigger className="w-24 bg-transparent">
                <SelectValue placeholder="Today" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filter Tasks
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md"
          />
          <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
            <SelectTrigger className="w-40 bg-transparent">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="assignee">Group by Assignee</SelectItem>
              <SelectItem value="status">Group by Status</SelectItem>
              <SelectItem value="project">Group by Project</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {groupBy === "none" ? (
          <div className="space-y-3 p-6">
            {filteredAndGroupedTasks.ungrouped && filteredAndGroupedTasks.ungrouped.length > 0 ? (
              filteredAndGroupedTasks.ungrouped.map((task) => (
                <TaskListCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {Object.entries(filteredAndGroupedTasks).map(([groupKey, tasks]) => (
              <div key={groupKey}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-sm">{groupKey}</h3>
                  <Badge variant="outline" className="text-xs">
                    {tasks.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskListCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
