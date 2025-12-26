"use client"

import * as React from "react"
import { Clock, Share, MoreHorizontal, Calendar, Tag, Users, Paperclip, Download, Edit } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { TaskCreateEditDialog } from "./task-create-edit-dialog"
import type { Task } from "@/lib/types"
import { mockUsers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface TaskActivity {
  id: string
  userId: string
  action: string
  details: string
  timestamp: Date
  type: "status" | "comment" | "file" | "assignment" | "reaction"
  fileUrl?: string
  fileSize?: string
}

interface TaskDetailModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const [comment, setComment] = React.useState("")
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [activities] = React.useState<TaskActivity[]>([
    {
      id: "act-1",
      userId: "user-3",
      action: "changed the status of",
      details: '"Design Homepage Wireframe" from To Do to In Progress',
      timestamp: new Date(Date.now() - 3600000),
      type: "status",
    },
    {
      id: "act-2",
      userId: "user-2",
      action: "added reaction 🔥 to",
      details: "Design Homepage Wireframe",
      timestamp: new Date(Date.now() - 7200000),
      type: "reaction",
    },
    {
      id: "act-3",
      userId: "user-3",
      action: "added a comment in",
      details: "Design Homepage Wireframe",
      timestamp: new Date(Date.now() - 10800000),
      type: "comment",
    },
    {
      id: "act-4",
      userId: "user-2",
      action: "uploaded the",
      details: "User Flow",
      timestamp: new Date(Date.now() - 14400000),
      type: "file",
      fileUrl: "user-flow.pdf",
      fileSize: "2.36 mb",
    },
    {
      id: "act-5",
      userId: "user-3",
      action: "added section 3 in",
      details: "Design Homepage Wireframe",
      timestamp: new Date(Date.now() - 86400000),
      type: "comment",
    },
    {
      id: "act-6",
      userId: "user-3",
      action: "was assigned",
      details: "Design Homepage Wireframe",
      timestamp: new Date(Date.now() - 172800000),
      type: "assignment",
    },
  ])

  if (!task) return null

  const handleSaveTask = (taskData: Partial<Task>) => {
    console.log(" Saving edited task:", taskData)
    setEditDialogOpen(false)
    // In real implementation, this would update the task
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return "just now"
    if (hours < 24) return `${hours}:${String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0")} AM`
    if (days === 1) return "Yesterday"
    return date.toLocaleDateString()
  }

  const groupActivitiesByDate = (activities: TaskActivity[]) => {
    const groups: { [key: string]: TaskActivity[] } = {}
    activities.forEach((activity) => {
      const date = new Date(activity.timestamp)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let key = "Older"
      if (date.toDateString() === today.toDateString()) {
        key = "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Yesterday"
      }

      if (!groups[key]) groups[key] = []
      groups[key].push(activity)
    })
    return groups
  }

  const activityGroups = groupActivitiesByDate(activities)

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl h-[90vh] p-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Clock className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created time</span>
                  <span className="ml-auto">September 20, 2024 10:55 AM</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  </div>
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={cn("ml-auto", getStatusColor(task.status))}>
                    {task.status === "in-progress"
                      ? "In Research"
                      : task.status === "todo"
                        ? "Not Started"
                        : "Complete"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-muted-foreground">Priority</span>
                  <Badge className={cn("ml-auto", getPriorityColor(task.priority))}>{task.priority}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="ml-auto">{task.dueDate.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tags</span>
                <div className="flex gap-2 ml-auto">
                  <Badge variant="secondary">Task</Badge>
                  <Badge variant="secondary">Wireframe</Badge>
                  <Badge variant="secondary">Homepage</Badge>
                </div>
              </div>

              {/* Assignees */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Assignees</span>
                <div className="flex -space-x-2 ml-auto">
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

              <Separator />

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Project Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
              </div>

              <Separator />

              {/* Tabs */}
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="my-work">My Work</TabsTrigger>
                  <TabsTrigger value="assigned">Assigned</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="space-y-6 mt-6">
                  {Object.entries(activityGroups).map(([date, activities]) => (
                    <div key={date}>
                      <h4 className="text-sm font-semibold mb-3">{date}</h4>
                      <div className="space-y-4">
                        {activities.map((activity) => {
                          const user = mockUsers.find((u) => u.id === activity.userId)
                          return (
                            <div key={activity.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                                <AvatarFallback className="text-xs">{user?.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="text-sm">
                                  <span className="font-medium">{user?.name}</span>{" "}
                                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                                  {activity.type === "status" && (
                                    <span className="font-medium">{activity.details}</span>
                                  )}
                                  {activity.type === "file" && (
                                    <div className="mt-2 flex items-center gap-2 p-3 border rounded-lg bg-muted/50 w-fit">
                                      <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                                        <Paperclip className="h-5 w-5 text-red-600 dark:text-red-400" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{activity.details}</p>
                                        <p className="text-xs text-muted-foreground">PDF · {activity.fileSize}</p>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                  {activity.type !== "status" && activity.type !== "file" && (
                                    <span className="font-medium">{activity.details}</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{formatTime(activity.timestamp)}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="my-work" className="mt-6">
                  <p className="text-sm text-muted-foreground text-center py-8">No work items assigned to you</p>
                </TabsContent>

                <TabsContent value="assigned" className="mt-6">
                  <p className="text-sm text-muted-foreground text-center py-8">No assigned items</p>
                </TabsContent>

                <TabsContent value="comments" className="mt-6 space-y-4">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <Button size="sm">Post Comment</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <TaskCreateEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={task}
        onSave={handleSaveTask}
        mode="edit"
      />
    </>
  )
}
