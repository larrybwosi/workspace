"use client"

import * as React from "react"
import { Calendar, Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { mockUsers, mockChannels } from "@/lib/mock-data"
import type { Task } from "@/lib/types"

interface TaskCreateEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onSave: (task: Partial<Task>) => void
  mode: "create" | "edit"
}

export function TaskCreateEditDialog({ open, onOpenChange, task, onSave, mode }: TaskCreateEditDialogProps) {
  const [title, setTitle] = React.useState(task?.title || "")
  const [description, setDescription] = React.useState(task?.description || "")
  const [status, setStatus] = React.useState(task?.status || "todo")
  const [priority, setPriority] = React.useState(task?.priority || "medium")
  const [assignees, setAssignees] = React.useState<string[]>(task?.assignees || [])
  const [dueDate, setDueDate] = React.useState(task?.dueDate ? task.dueDate.toISOString().split("T")[0] : "")
  const [tags, setTags] = React.useState<string[]>(["Task", "Wireframe", "Homepage"])
  const [linkedChannels, setLinkedChannels] = React.useState<string[]>(task?.linkedChannels || [])
  const [newTag, setNewTag] = React.useState("")

  React.useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status)
      setPriority(task.priority)
      setAssignees(task.assignees)
      setDueDate(task.dueDate.toISOString().split("T")[0])
      setLinkedChannels(task.linkedChannels || [])
    }
  }, [task])

  const handleSave = () => {
    const taskData: Partial<Task> = {
      ...(task && { id: task.id }),
      title,
      description,
      status,
      priority,
      assignees,
      dueDate: new Date(dueDate),
      linkedChannels,
      comments: task?.comments || 0,
      links: task?.links || 0,
      progress: task?.progress || { completed: 0, total: 3 },
    }
    onSave(taskData)
    onOpenChange(false)
  }

  const toggleAssignee = (userId: string) => {
    setAssignees((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const toggleChannel = (channelId: string) => {
    setLinkedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Task" : "Edit Task"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
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
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
              {mockUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleAssignee(user.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                    assignees.includes(user.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  className="h-7 w-32"
                />
                <Button size="sm" variant="ghost" onClick={addTag} className="h-7 px-2">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Linked Channels */}
          <div className="space-y-2">
            <Label>Linked Channels</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
              {mockChannels.slice(0, 5).map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => toggleChannel(channel.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                    linkedChannels.includes(channel.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <span>{channel.icon}</span>
                  <span className="text-sm">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title || !dueDate}>
            {mode === "create" ? "Create Task" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
