"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface WorkspaceOutgoingWebhooksProps {
  workspaceSlug: string
}

export function WorkspaceOutgoingWebhooks({ workspaceSlug }: WorkspaceOutgoingWebhooksProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Outgoing Webhooks</CardTitle>
            <CardDescription>Send workspace events to external services</CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 size-4" />
            Create Webhook
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Outgoing webhooks notify external services when events occur in your workspace, such as new channels created,
          members added, or projects updated.
        </p>
      </CardContent>
    </Card>
  )
}
