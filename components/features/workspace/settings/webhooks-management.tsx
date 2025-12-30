"use client"

import { useState } from "react"
import { Plus, Trash2, Copy, Check, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

interface WebhooksManagementProps {
  workspaceId: string
}

const WEBHOOK_EVENTS = [
  { id: "message.created", label: "Message Created", category: "Messages" },
  { id: "message.updated", label: "Message Updated", category: "Messages" },
  { id: "message.deleted", label: "Message Deleted", category: "Messages" },
  { id: "channel.created", label: "Channel Created", category: "Channels" },
  { id: "channel.updated", label: "Channel Updated", category: "Channels" },
  { id: "channel.deleted", label: "Channel Deleted", category: "Channels" },
  { id: "member.joined", label: "Member Joined", category: "Members" },
  { id: "member.left", label: "Member Left", category: "Members" },
  { id: "member.role_changed", label: "Member Role Changed", category: "Members" },
  { id: "project.created", label: "Project Created", category: "Projects" },
  { id: "project.updated", label: "Project Updated", category: "Projects" },
  { id: "task.created", label: "Task Created", category: "Tasks" },
  { id: "task.completed", label: "Task Completed", category: "Tasks" },
]

export function WebhooksManagement({ workspaceId }: WebhooksManagementProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewSecretDialog, setViewSecretDialog] = useState<any>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    events: [] as string[],
  })

  // Fetch webhooks
  const { data, isLoading } = useQuery({
    queryKey: ["workspace-webhooks", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/webhooks`)
      if (!res.ok) throw new Error("Failed to fetch webhooks")
      return res.json()
    },
  })

  const webhooks = data || []

  // Create webhook mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create webhook")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-webhooks", workspaceId] })
      setCreateDialogOpen(false)
      setViewSecretDialog(data)
      setFormData({
        name: "",
        url: "",
        events: [],
      })
      toast({
        title: "Webhook created",
        description: "Your webhook has been created successfully.",
      })
    },
  })

  // Delete webhook mutation
  const deleteMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/webhooks/${webhookId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete webhook")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-webhooks", workspaceId] })
      toast({
        title: "Webhook deleted",
        description: "The webhook has been deleted successfully.",
      })
    },
  })

  // Toggle webhook mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ webhookId, active }: { webhookId: string; active: boolean }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })
      if (!res.ok) throw new Error("Failed to toggle webhook")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-webhooks", workspaceId] })
    },
  })

  const handleCreateWebhook = () => {
    createMutation.mutate({
      name: formData.name,
      url: formData.url,
      events: formData.events,
    })
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
    toast({
      title: "Copied to clipboard",
      description: "Webhook secret has been copied.",
    })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading webhooks...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Outgoing Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Send real-time events to external services when activities occur in your workspace
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {/* Webhooks List */}
      <div className="space-y-3">
        {webhooks.map((webhook: any) => (
          <Card key={webhook.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">{webhook.name}</h4>
                    <Badge variant={webhook.active ? "default" : "secondary"}>
                      {webhook.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono text-xs">{webhook.url}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {webhook.events.map((event: string) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Switch
                    checked={webhook.active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ webhookId: webhook.id, active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(webhook.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webhooks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No webhooks yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create webhooks to send real-time events to external services
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Webhook
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>Configure a webhook to send events to an external service</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook Name</Label>
              <Input
                placeholder="e.g., Slack Notifications"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Payload URL</Label>
              <Input
                type="url"
                placeholder="https://example.com/webhook"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This URL will receive POST requests when selected events occur
              </p>
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <div className="border rounded-lg p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {Object.entries(
                  WEBHOOK_EVENTS.reduce(
                    (acc, event) => {
                      if (!acc[event.category]) acc[event.category] = []
                      acc[event.category].push(event)
                      return acc
                    },
                    {} as Record<string, typeof WEBHOOK_EVENTS>,
                  ),
                ).map(([category, events]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{category}</h4>
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={event.id}
                            checked={formData.events.includes(event.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, events: [...formData.events, event.id] })
                              } else {
                                setFormData({
                                  ...formData,
                                  events: formData.events.filter((e) => e !== event.id),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={event.id} className="text-sm font-normal cursor-pointer">
                            {event.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateWebhook}
                disabled={!formData.name || !formData.url || formData.events.length === 0 || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Webhook"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Secret Dialog */}
      <Dialog open={!!viewSecretDialog} onOpenChange={() => setViewSecretDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Created</DialogTitle>
            <DialogDescription>Save your webhook secret for signature verification</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Webhook Secret</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Use this secret to verify webhook signatures and ensure requests are authentic.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Secret</Label>
              <div className="flex gap-2">
                <Input value={viewSecretDialog?.secret || ""} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => viewSecretDialog?.secret && copySecret(viewSecretDialog.secret)}
                >
                  {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
