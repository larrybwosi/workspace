"use client"

import * as React from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CheckSquare, Clock, Users, Calendar, Plus } from 'lucide-react'
import type { Task, CalendarEvent } from "@/lib/types"

interface DayTasksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  tasks: Task[]
  events: CalendarEvent[]
  onCreateTask: () => void
  onTaskClick: (task: Task) => void
}

export function DayTasksDialog({
  open,
  onOpenChange,
  date,
  tasks,
  events,
  onCreateTask,
  onTaskClick,
}: DayTasksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(date, "EEEE, MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Events Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Events ({events.length})
                </h3>
              </div>
              
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events scheduled for this day</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border"
                      style={{ borderLeft: `4px solid ${event.color}` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{event.title}</div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(event.startDate, "h:mm a")} - {format(event.endDate, "h:mm a")}
                            </div>
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.attendees.length} attendees
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">{event.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks ({tasks.length})
                </h3>
                <Button size="sm" variant="outline" onClick={onCreateTask}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>
              
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks for this day</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {task.assignees.length} assigned
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={
                              task.status === "done"
                                ? "default"
                                : task.status === "in-progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {task.status}
                          </Badge>
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
