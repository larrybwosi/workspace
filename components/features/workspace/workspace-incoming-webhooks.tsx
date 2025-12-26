"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface WorkspaceIncomingWebhooksProps {
  workspaceSlug: string
}

export function WorkspaceIncomingWebhooks({ workspaceSlug }: WorkspaceIncomingWebhooksProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Incoming Webhooks</CardTitle>
            <CardDescription>Receive data from external services to create/update resources</CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 size-4" />
            Create Webhook
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Incoming webhooks allow external services to send data to your workspace and automatically create or update
          channels, departments, projects, and more.
        </p>
      </CardContent>
    </Card>
  )
}
