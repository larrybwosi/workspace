"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateWebhook } from "@/hooks/api/use-integrations"
import { toast } from "sonner"

const AVAILABLE_EVENTS = [
  { id: "task.created", label: "Task Created", description: "When a new task is created" },
  { id: "task.updated", label: "Task Updated", description: "When a task is updated" },
  { id: "task.deleted", label: "Task Deleted", description: "When a task is deleted" },
  { id: "project.created", label: "Project Created", description: "When a new project is created" },
  { id: "project.updated", label: "Project Updated", description: "When a project is updated" },
  { id: "message.created", label: "Message Sent", description: "When a message is sent" },
  { id: "user.joined", label: "User Joined", description: "When a user joins the workspace" },
  { id: "sprint.started", label: "Sprint Started", description: "When a sprint begins" },
  { id: "sprint.completed", label: "Sprint Completed", description: "When a sprint ends" },
]

interface CreateWebhookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWebhookDialog({ open, onOpenChange }: CreateWebhookDialogProps) {
  const [name, setName] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [events, setEvents] = React.useState<string[]>([])
  
  const createMutation = useCreateWebhook()

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the webhook")
      return
    }

    if (!url.trim() || !url.startsWith("http")) {
      toast.error("Please enter a valid webhook URL")
      return
    }

    if (events.length === 0) {
      toast.error("Please select at least one event")
      return
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        url: url.trim(),
        events,
      })
      
      toast.success("Webhook created successfully")
      setName("")
      setUrl("")
      setEvents([])
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to create webhook")
    }
  }

  const toggleEvent = (eventId: string) => {
    setEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Configure a webhook endpoint to receive real-time event notifications
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-name">Webhook Name</Label>
            <Input
              id="webhook-name"
              placeholder="e.g., Slack Notifications, Task Updates"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              placeholder="https://your-server.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We'll send a POST request to this URL when events occur
            </p>
          </div>

          <div className="space-y-3">
            <Label>Events to Subscribe</Label>
            <p className="text-sm text-muted-foreground">
              Select which events should trigger this webhook
            </p>
            <div className="space-y-3">
              {AVAILABLE_EVENTS.map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={event.id}
                    checked={events.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={event.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {event.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Webhook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
