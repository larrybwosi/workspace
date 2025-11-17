"use client"

import * as React from "react"
import { Calendar, Plus, X, Clock, Tag, LinkIcon, Bell, Users, Paperclip, AlertCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { FileUpload } from "@/components/file-upload"
import { mockUsers, mockChannels } from "@/lib/mock-data"
import type { Task } from "@/lib/types"
import type { UploadedFile } from "@/lib/upload-utils"
import { useCreateTask, useUpdateTask } from "@/hooks/api/use-tasks"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface TaskCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onSave?: (task: Partial<Task>) => void
  mode: "create" | "edit"
  defaultStatus?: Task["status"]
  defaultDueDate?: Date
  projectId: string // Added projectId as required prop
}

export function TaskCreateSheet({
  open,
  onOpenChange,
  task,
  onSave,
  mode,
  defaultStatus = "todo",
  defaultDueDate,
  projectId, // Added projectId parameter
}: TaskCreateSheetProps) {
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const queryClient = useQueryClient()

  const [title, setTitle] = React.useState(task?.title || "")
  const [description, setDescription] = React.useState(task?.description || "")
  const [status, setStatus] = React.useState(task?.status || defaultStatus)
  const [priority, setPriority] = React.useState(task?.priority || "medium")
  const [assignees, setAssignees] = React.useState<string[]>(task?.assignees || [])
  const [dueDate, setDueDate] = React.useState(
    task?.dueDate
      ? task.dueDate.toISOString().split("T")[0]
      : defaultDueDate
        ? defaultDueDate.toISOString().split("T")[0]
        : "",
  )
  const [startDate, setStartDate] = React.useState(task?.startDate ? task.startDate.toISOString().split("T")[0] : "")
  const [estimatedHours, setEstimatedHours] = React.useState(task?.estimatedHours?.toString() || "")
  const [tags, setTags] = React.useState<string[]>(task?.tags || [])
  const [linkedChannels, setLinkedChannels] = React.useState<string[]>(task?.linkedChannels || [])
  const [newTag, setNewTag] = React.useState("")
  const [sprintId, setSprintId] = React.useState(task?.sprintId || "")
  const [attachments, setAttachments] = React.useState<UploadedFile[]>([])
  const [notifyAssignees, setNotifyAssignees] = React.useState(true)
  const [sendDailyDigest, setSendDailyDigest] = React.useState(false)
  const [alertOnDueDate, setAlertOnDueDate] = React.useState(true)
  const [alertBeforeDays, setAlertBeforeDays] = React.useState("1")
  const [escalateOnOverdue, setEscalateOnOverdue] = React.useState(false)
  const [escalateTo, setEscalateTo] = React.useState<string[]>([])
  const [watchers, setWatchers] = React.useState<string[]>([])
  const [customReminders, setCustomReminders] = React.useState<Array<{time: string, message: string}>>([])

  React.useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status)
      setPriority(task.priority)
      setAssignees(task.assignees)
      setDueDate(task.dueDate.toISOString().split("T")[0])
      setStartDate(task.startDate?.toISOString().split("T")[0] || "")
      setEstimatedHours(task.estimatedHours?.toString() || "")
      setTags(task.tags || [])
      setLinkedChannels(task.linkedChannels || [])
      setSprintId(task.sprintId || "")
      setAttachments(task.attachments || [])
      setNotifyAssignees(task.notificationSettings?.notifyAssignees || true)
      setSendDailyDigest(task.notificationSettings?.sendDailyDigest || false)
      setAlertOnDueDate(task.notificationSettings?.alertOnDueDate || true)
      setAlertBeforeDays(task.notificationSettings?.alertBeforeDays?.toString() || "1")
      setEscalateOnOverdue(task.notificationSettings?.escalateOnOverdue || false)
      setEscalateTo(task.notificationSettings?.escalateTo || [])
      setWatchers(task.watchers || [])
      setCustomReminders(task.customReminders || [])
    }
  }, [task])

  const handleSave = async () => {
    const taskData: Partial<Task> = {
      ...(task && { id: task.id }),
      title,
      description,
      status,
      priority,
      assignees,
      dueDate: new Date(dueDate),
      startDate: startDate ? new Date(startDate) : undefined,
      estimatedHours: estimatedHours ? Number.parseFloat(estimatedHours) : undefined,
      tags,
      linkedChannels,
      sprintId,
      comments: task?.comments || 0,
      links: task?.links || 0,
      progress: task?.progress || { completed: 0, total: 0 },
      attachments: attachments.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        url: file.url,
        size: file.size.toString(),
      })),
      notificationSettings: {
        notifyAssignees,
        sendDailyDigest,
        alertOnDueDate,
        alertBeforeDays: parseInt(alertBeforeDays),
        escalateOnOverdue,
        escalateTo,
      },
      watchers,
      customReminders,
    }

    try {
      if (mode === "create") {
        await createTaskMutation.mutateAsync({ projectId, ...taskData })
        toast.success("Task created successfully")
      } else if (task) {
        await updateTaskMutation.mutateAsync({ id: task.id, projectId, ...taskData })
        toast.success("Task updated successfully")
      }
      
      // Call the onSave callback if provided (for legacy support)
      onSave?.(taskData)
      onOpenChange(false)
    } catch (error) {
      toast.error(mode === "create" ? "Failed to create task" : "Failed to update task")
      console.error(" Error saving task:", error)
    }
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

  const handleAttachmentsUpload = (files: UploadedFile[]) => {
    setAttachments((prev) => [...prev, ...files])
  }

  const handleRemoveAttachment = (file: UploadedFile) => {
    setAttachments((prev) => prev.filter((f) => f.id !== file.id))
  }

  const toggleWatcher = (userId: string) => {
    setWatchers((prev) => 
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const toggleEscalation = (userId: string) => {
    setEscalateTo((prev) => 
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const addCustomReminder = () => {
    setCustomReminders((prev) => [...prev, { time: "", message: "" }])
  }

  const updateCustomReminder = (index: number, field: 'time' | 'message', value: string) => {
    setCustomReminders((prev) => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }

  const removeCustomReminder = (index: number) => {
    setCustomReminders((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>{mode === "create" ? "Create New Task" : "Edit Task"}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                <TabsTrigger value="links">Links & Tags</TabsTrigger>
                <TabsTrigger value="attachments">
                  <Paperclip className="h-4 w-4 mr-1" />
                  Attachments
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-1" />
                  Alerts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
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
                    className="min-h-[120px]"
                  />
                </div>

                <Separator />

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as Task["status"])}>
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
                    <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
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

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
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
                </div>

                {/* Estimated Hours */}
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="estimatedHours"
                      type="number"
                      step="0.5"
                      placeholder="e.g., 8"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Sprint */}
                <div className="space-y-2">
                  <Label htmlFor="sprint">Sprint</Label>
                  <Select value={sprintId} onValueChange={setSprintId}>
                    <SelectTrigger id="sprint">
                      <SelectValue placeholder="Select sprint..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sprint-1">Sprint 1 - Feb 2024</SelectItem>
                      <SelectItem value="sprint-2">Sprint 2 - Mar 2024</SelectItem>
                      <SelectItem value="backlog">Backlog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4 mt-4">
                {/* Assignees */}
                <div className="space-y-2">
                  <Label>Assignees</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-[400px] overflow-y-auto">
                    {mockUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => toggleAssignee(user.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          assignees.includes(user.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {assignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-sm text-muted-foreground">Selected:</span>
                      {assignees.map((userId) => {
                        const user = mockUsers.find((u) => u.id === userId)
                        return (
                          <Badge key={userId} variant="secondary" className="gap-1">
                            {user?.name}
                            <button onClick={() => toggleAssignee(userId)} className="hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Watchers section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label>Watchers (will receive notifications)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-[300px] overflow-y-auto">
                    {mockUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => toggleWatcher(user.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          watchers.includes(user.id)
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{user.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {watchers.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-sm text-muted-foreground">Watching:</span>
                      {watchers.map((userId) => {
                        const user = mockUsers.find((u) => u.id === userId)
                        return (
                          <Badge key={userId} variant="secondary" className="gap-1">
                            {user?.name}
                            <button onClick={() => toggleWatcher(userId)} className="hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="links" className="space-y-4 mt-4">
                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag()}
                      />
                      <Button size="sm" onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Linked Channels */}
                <div className="space-y-2">
                  <Label>Linked Channels</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-[300px] overflow-y-auto">
                    {mockChannels.slice(0, 8).map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => toggleChannel(channel.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          linkedChannels.includes(channel.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        <span className="text-lg">{channel.icon}</span>
                        <span className="text-sm font-medium">{channel.name}</span>
                      </button>
                    ))}
                  </div>
                  {linkedChannels.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-sm text-muted-foreground">Linked:</span>
                      {linkedChannels.map((channelId) => {
                        const channel = mockChannels.find((c) => c.id === channelId)
                        return (
                          <Badge key={channelId} variant="secondary" className="gap-1">
                            <LinkIcon className="h-3 w-3" />
                            {channel?.name}
                            <button onClick={() => toggleChannel(channelId)} className="hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Task Attachments</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload files, documents, images, or any resources related to this task.
                  </p>
                  <FileUpload
                    onUploadComplete={handleAttachmentsUpload}
                    onRemove={handleRemoveAttachment}
                    multiple={true}
                    maxSize={50}
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Attached Files ({attachments.length})</Label>
                      <Badge variant="outline">{attachments.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024).toFixed(2)} MB</Badge>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {/* Basic Notifications */}
                  <div className="space-y-3">
                    <Label className="text-base">Basic Notifications</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notify-assignees">Notify Assignees</Label>
                        <p className="text-sm text-muted-foreground">
                          Send immediate notification when task is created/updated
                        </p>
                      </div>
                      <Switch
                        id="notify-assignees"
                        checked={notifyAssignees}
                        onCheckedChange={setNotifyAssignees}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="daily-digest">Daily Digest</Label>
                        <p className="text-sm text-muted-foreground">
                          Include this task in daily summary emails
                        </p>
                      </div>
                      <Switch
                        id="daily-digest"
                        checked={sendDailyDigest}
                        onCheckedChange={setSendDailyDigest}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Due Date Alerts */}
                  <div className="space-y-3">
                    <Label className="text-base">Due Date Alerts</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="alert-due">Alert on Due Date</Label>
                        <p className="text-sm text-muted-foreground">
                          Send reminder on the task due date
                        </p>
                      </div>
                      <Switch
                        id="alert-due"
                        checked={alertOnDueDate}
                        onCheckedChange={setAlertOnDueDate}
                      />
                    </div>

                    {alertOnDueDate && (
                      <div className="space-y-2 pl-4 border-l-2">
                        <Label htmlFor="alert-before">Alert Before (days)</Label>
                        <Select value={alertBeforeDays} onValueChange={setAlertBeforeDays}>
                          <SelectTrigger id="alert-before">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day before</SelectItem>
                            <SelectItem value="2">2 days before</SelectItem>
                            <SelectItem value="3">3 days before</SelectItem>
                            <SelectItem value="7">1 week before</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Escalation */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <Label className="text-base">Priority Escalation</Label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="escalate">Escalate on Overdue</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically notify managers when task becomes overdue
                        </p>
                      </div>
                      <Switch
                        id="escalate"
                        checked={escalateOnOverdue}
                        onCheckedChange={setEscalateOnOverdue}
                      />
                    </div>

                    {escalateOnOverdue && (
                      <div className="space-y-2 pl-4 border-l-2">
                        <Label>Escalate To</Label>
                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-[200px] overflow-y-auto">
                          {mockUsers.filter(u => u.role === "Project Manager" || u.role === "Product Manager").map((user) => (
                            <button
                              key={user.id}
                              onClick={() => toggleEscalation(user.id)}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-colors text-sm ${
                                escalateTo.includes(user.id)
                                  ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20"
                                  : "bg-background hover:bg-muted"
                              }`}
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="truncate">{user.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Custom Reminders */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Custom Reminders</Label>
                      <Button size="sm" variant="outline" onClick={addCustomReminder}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Reminder
                      </Button>
                    </div>

                    {customReminders.length > 0 && (
                      <div className="space-y-2">
                        {customReminders.map((reminder, index) => (
                          <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                            <div className="flex-1 space-y-2">
                              <Input
                                type="datetime-local"
                                value={reminder.time}
                                onChange={(e) => updateCustomReminder(index, 'time', e.target.value)}
                                placeholder="Reminder time"
                              />
                              <Input
                                value={reminder.message}
                                onChange={(e) => updateCustomReminder(index, 'message', e.target.value)}
                                placeholder="Reminder message"
                              />
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeCustomReminder(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <SheetFooter className="p-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title || !dueDate || createTaskMutation.isPending || updateTaskMutation.isPending}
          >
            {createTaskMutation.isPending || updateTaskMutation.isPending 
              ? "Saving..." 
              : mode === "create" ? "Create Task" : "Save Changes"
            }
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
