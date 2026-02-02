"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Copy, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface WorkspaceIncomingWebhooksProps {
  workspaceSlug: string
}

export function WorkspaceIncomingWebhooks({ workspaceSlug }: WorkspaceIncomingWebhooksProps) {
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [action, setAction] = useState("create_channel")
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null)

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["workspace-webhooks", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/webhooks`)
      return data
    },
  })

  // Create webhook
  const createWebhook = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post(`/workspaces/${workspaceSlug}/webhooks`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-webhooks", workspaceSlug] })
      toast.success("Webhook created successfully")
      setCreateDialogOpen(false)
      setName("")
    },
    onError: () => {
      toast.error("Failed to create webhook")
    },
  })

  // Delete webhook
  const deleteWebhook = useMutation({
    mutationFn: async (webhookId: string) => {
      await apiClient.delete(`/workspaces/${workspaceSlug}/webhooks/${webhookId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-webhooks", workspaceSlug] })
      toast.success("Webhook deleted")
    },
    onError: () => {
      toast.error("Failed to delete webhook")
    },
  })

  // Regenerate token
  const regenerateToken = useMutation({
    mutationFn: async (webhookId: string) => {
      const { data } = await apiClient.post(`/workspaces/${workspaceSlug}/webhooks/${webhookId}/regenerate`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-webhooks", workspaceSlug] })
      toast.success("Token regenerated")
    },
    onError: () => {
      toast.error("Failed to regenerate token")
    },
  })

  const handleCreate = () => {
    createWebhook.mutate({ name, action })
  }

  const handleCopyUrl = (webhook: any) => {
    const url = `${window.location.origin}/api/webhooks/${webhook.id}`
    navigator.clipboard.writeText(url)
    toast.success("Webhook URL copied")
  }

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast.success("Token copied")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incoming Webhooks</CardTitle>
              <CardDescription>Receive data from external services to create/update resources</CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Create Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading webhooks...</div>
          ) : webhooks && webhooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook: any) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{webhook.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {webhook.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{webhook.deliveryCount || 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {webhook.lastUsedAt ? new Date(webhook.lastUsedAt).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(webhook)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => regenerateToken.mutate(webhook.id)}
                          disabled={regenerateToken.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWebhook.mutate(webhook.id)}
                          disabled={deleteWebhook.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No webhooks configured yet</p>
              <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Incoming Webhook</DialogTitle>
            <DialogDescription>Configure a new webhook to receive data from external services</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Webhook Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="GitHub Integration"
              />
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create_channel">Create Channel</SelectItem>
                  <SelectItem value="update_channel">Update Channel</SelectItem>
                  <SelectItem value="create_department">Create Department</SelectItem>
                  <SelectItem value="update_department">Update Department</SelectItem>
                  <SelectItem value="create_project">Create Project</SelectItem>
                  <SelectItem value="add_member">Add Member</SelectItem>
                  <SelectItem value="send_message">Send Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createWebhook.isPending || !name}>
              {createWebhook.isPending ? "Creating..." : "Create Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
