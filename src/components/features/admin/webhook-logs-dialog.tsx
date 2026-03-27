"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useWebhookLogs } from "@/hooks/api/use-integrations"
import { format } from "date-fns"
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

interface WebhookLogsDialogProps {
  webhookId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WebhookLogsDialog({ webhookId, open, onOpenChange }: WebhookLogsDialogProps) {
  const { data: logs, isLoading } = useWebhookLogs(webhookId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Webhook Delivery Logs</DialogTitle>
          <DialogDescription>
            Recent webhook deliveries and their responses
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
          ) : logs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No delivery logs yet</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {logs?.map((log: any) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-semibold">{log.event}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </span>
                  </div>

                  {log.statusCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.statusCode}
                      </Badge>
                    </div>
                  )}

                  {log.error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                      {log.error}
                    </div>
                  )}

                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground">
                      View Payload
                    </summary>
                    <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto text-xs">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
