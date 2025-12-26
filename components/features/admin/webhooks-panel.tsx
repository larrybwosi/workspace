"use client"

import * as React from "react"
import { Webhook, Plus, Trash2, MoreVertical, CheckCircle2, XCircle, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWebhooks, useCreateWebhook, useDeleteWebhook, useUpdateWebhook } from "@/hooks/api/use-integrations"
import { CreateWebhookDialog } from "@/components/create-webhook-dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { WebhookLogsDialog } from "./webhook-logs-dialog"

export function WebhooksPanel() {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [deleteWebhookId, setDeleteWebhookId] = React.useState<string | null>(null)
  const [logsWebhookId, setLogsWebhookId] = React.useState<string | null>(null)
  
  const { data: webhooks, isLoading } = useWebhooks()
  const deleteMutation = useDeleteWebhook()
  const updateMutation = useUpdateWebhook()

  const handleDelete = async () => {
    if (!deleteWebhookId) return
    
    try {
      await deleteMutation.mutateAsync(deleteWebhookId)
      toast.success("Webhook deleted successfully")
      setDeleteWebhookId(null)
    } catch (error) {
      toast.error("Failed to delete webhook")
    }
  }

  const toggleWebhookStatus = async (webhookId: string, isActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ webhookId, isActive: !isActive })
      toast.success(isActive ? "Webhook disabled" : "Webhook enabled")
    } catch (error) {
      toast.error("Failed to update webhook")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            Configure webhooks to receive real-time notifications for events in your workspace
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {/* Webhooks List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading webhooks...</div>
      ) : webhooks?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No webhooks configured yet</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks?.map((webhook: any) => (
            <Card key={webhook.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{webhook.name}</h3>
                      <Badge variant={webhook.isActive ? "default" : "secondary"}>
                        {webhook.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          "Inactive"
                        )}
                      </Badge>
                    </div>

                    <div className="text-sm font-mono bg-muted p-3 rounded break-all">
                      {webhook.url}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(webhook.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last fired:</span>{" "}
                        <span className="font-medium">
                          {webhook.lastFiredAt
                            ? format(new Date(webhook.lastFiredAt), "MMM d, yyyy HH:mm")
                            : "Never"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Subscribed Events:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {webhook.events.map((event: string) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLogsWebhookId(webhook.id)}>
                        <Activity className="h-4 w-4 mr-2" />
                        View Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleWebhookStatus(webhook.id, webhook.isActive)}
                      >
                        {webhook.isActive ? "Disable" : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteWebhookId(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateWebhookDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      
      {logsWebhookId && (
        <WebhookLogsDialog
          webhookId={logsWebhookId}
          open={!!logsWebhookId}
          onOpenChange={() => setLogsWebhookId(null)}
        />
      )}

      <AlertDialog open={!!deleteWebhookId} onOpenChange={() => setDeleteWebhookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? You will stop receiving events at
              this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
