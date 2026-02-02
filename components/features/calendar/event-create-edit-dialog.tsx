"use client"

import * as React from "react"
import { Calendar, Clock, MapPin, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { mockUsers } from "@/lib/mock-data"
import type { CalendarEvent } from "@/lib/types"

interface EventCreateEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  onSave: (event: Partial<CalendarEvent>) => void
  mode: "create" | "edit"
  defaultDate?: Date
}

export function EventCreateEditDialog({
  open,
  onOpenChange,
  event,
  onSave,
  mode,
  defaultDate,
}: EventCreateEditDialogProps) {
  const [title, setTitle] = React.useState(event?.title || "")
  const [description, setDescription] = React.useState(event?.description || "")
  const [type, setType] = React.useState<CalendarEvent["type"]>(event?.type || "meeting")
  const [startDate, setStartDate] = React.useState(
    event?.startDate
      ? event.startDate.toISOString().split("T")[0]
      : defaultDate
        ? defaultDate.toISOString().split("T")[0]
        : "",
  )
  const [startTime, setStartTime] = React.useState(
    event?.startDate ? event.startDate.toISOString().split("T")[1].slice(0, 5) : "09:00",
  )
  const [endDate, setEndDate] = React.useState(
    event?.endDate
      ? event.endDate.toISOString().split("T")[0]
      : defaultDate
        ? defaultDate.toISOString().split("T")[0]
        : "",
  )
  const [endTime, setEndTime] = React.useState(
    event?.endDate ? event.endDate.toISOString().split("T")[1].slice(0, 5) : "10:00",
  )
  const [allDay, setAllDay] = React.useState(event?.allDay || false)
  const [location, setLocation] = React.useState(event?.location || "")
  const [attendees, setAttendees] = React.useState<string[]>(event?.attendees || [])
  const [recurring, setRecurring] = React.useState(event?.recurring || "none")
  const [color, setColor] = React.useState(event?.color || "#3b82f6")

  React.useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || "")
      setType(event.type)
      setStartDate(event.startDate.toISOString().split("T")[0])
      setStartTime(event.startDate.toISOString().split("T")[1].slice(0, 5))
      setEndDate(event.endDate.toISOString().split("T")[0])
      setEndTime(event.endDate.toISOString().split("T")[1].slice(0, 5))
      setAllDay(event.allDay || false)
      setLocation(event.location || "")
      setAttendees(event.attendees || [])
      setRecurring(event.recurring || "none")
      setColor(event.color || "#3b82f6")
    }
  }, [event])

  const handleSave = () => {
    const startDateTime = new Date(`${startDate}T${allDay ? "00:00" : startTime}`)
    const endDateTime = new Date(`${endDate}T${allDay ? "23:59" : endTime}`)

    const eventData: Partial<CalendarEvent> = {
      ...(event && { id: event.id }),
      title,
      description,
      type,
      startDate: startDateTime,
      endDate: endDateTime,
      allDay,
      location,
      attendees,
      recurring: recurring !== "none" ? recurring : undefined,
      color,
    }
    onSave(eventData)
    onOpenChange(false)
  }

  const toggleAttendee = (userId: string) => {
    setAttendees((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const colorOptions = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#8b5cf6", label: "Purple" },
    { value: "#22c55e", label: "Green" },
    { value: "#f59e0b", label: "Orange" },
    { value: "#ef4444", label: "Red" },
    { value: "#06b6d4", label: "Cyan" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Event" : "Edit Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="Enter event title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Event Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CalendarEvent["type"])}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>All Day Event</Label>
              <Switch checked={allDay} onCheckedChange={setAllDay} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
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

              {!allDay && (
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {!allDay && (
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter event description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Enter location or video call link..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Separator />

          {/* Attendees */}
          <div className="space-y-2">
            <Label>Attendees</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-[200px] overflow-y-auto">
              {mockUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleAttendee(user.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    attendees.includes(user.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name}</span>
                </button>
              ))}
            </div>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {attendees.map((userId) => {
                  const user = mockUsers.find((u) => u.id === userId)
                  return (
                    <Badge key={userId} variant="secondary" className="gap-1">
                      {user?.name}
                      <button onClick={() => toggleAttendee(userId)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Recurring */}
          <div className="space-y-2">
            <Label htmlFor="recurring">Recurring</Label>
            <Select value={recurring} onValueChange={setRecurring}>
              <SelectTrigger id="recurring">
                <SelectValue placeholder="Does not repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Event Color</Label>
            <div className="flex gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setColor(option.value)}
                  className={`h-10 w-10 rounded-lg border-2 transition-all ${
                    color === option.value ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.label}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title || !startDate || !endDate}>
            {mode === "create" ? "Create Event" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
