"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Calendar, Clock, Plus, Pause, Play, Trash2, Repeat } from 'lucide-react'
import { format } from "date-fns"

export function ScheduledNotificationsPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    scheduleType: "once",
    scheduledFor: "",
    recurrence: {
      frequency: 1,
      daysOfWeek: [],
      daysOfMonth: [],
    },
  })

  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["scheduled-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/scheduled-notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    },
  })

  const { data: stats } = useQuery({
    queryKey: ["scheduled-notifications-stats"],
    queryFn: async () => {
      const res = await fetch("/api/scheduled-notifications?stats=true")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/scheduled-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create notification")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-notifications"] })
      queryClient.invalidateQueries({ queryKey: ["scheduled-notifications-stats"] })
      setIsCreateOpen(false)
      setFormData({
        title: "",
        message: "",
        scheduleType: "once",
        scheduledFor: "",
        recurrence: { frequency: 1, daysOfWeek: [], daysOfMonth: [] },
      })
    },
  })

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/scheduled-notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      })
      if (!res.ok) throw new Error("Failed to pause notification")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-notifications"] })
    },
  })

  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/scheduled-notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      })
      if (!res.ok) throw new Error("Failed to resume notification")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-notifications"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/scheduled-notifications/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete notification")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-notifications"] })
      queryClient.invalidateQueries({ queryKey: ["scheduled-notifications-stats"] })
    },
  })

  const handleCreate = () => {
    createMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Scheduled Notifications</h2>
          <p className="text-sm text-muted-foreground">Manage your automated reminders</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Notification
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-600" />
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.active}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.sent}</div>
          </Card>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scheduled notifications</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first scheduled notification to stay on top of important tasks
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Notification
            </Button>
          </Card>
        ) : (
          notifications.map((notification: any) => (
            <Card key={notification.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{notification.title}</h3>
                    {notification.scheduleType !== "once" && (
                      <Badge variant="secondary">
                        <Repeat className="h-3 w-3 mr-1" />
                        {notification.scheduleType}
                      </Badge>
                    )}
                    <Badge variant={notification.isActive ? "default" : "secondary"}>
                      {notification.isActive ? "Active" : "Paused"}
                    </Badge>
                    {notification.isSent && <Badge variant="outline">Sent</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(notification.scheduledFor), "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(notification.scheduledFor), "hh:mm a")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isSent && (
                    <>
                      {notification.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => pauseMutation.mutate(notification.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => resumeMutation.mutate(notification.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Scheduled Notification</DialogTitle>
            <DialogDescription>Set up a notification to be sent at a specific time</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task deadline reminder"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Don't forget to complete your task"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="scheduleType">Schedule Type</Label>
              <Select
                value={formData.scheduleType}
                onValueChange={(value) => setFormData({ ...formData, scheduleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scheduledFor">Date & Time</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
