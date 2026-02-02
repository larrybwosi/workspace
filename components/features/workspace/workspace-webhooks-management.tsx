"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Download, Key, Shield, FileText } from "lucide-react"
import { WorkspaceIncomingWebhooks } from "@/components/features/workspace/workspace-incoming-webhooks"
import { WorkspaceOutgoingWebhooks } from "@/components/features/workspace/workspace-outgoing-webhooks"
import { WorkspaceResourceManagement } from "@/components/features/workspace/workspace-resource-management"

interface WorkspaceWebhooksManagementProps {
  workspaceSlug: string
}

export function WorkspaceWebhooksManagement({ workspaceSlug }: WorkspaceWebhooksManagementProps) {
  return (
    <Tabs defaultValue="incoming" className="space-y-6">
      <TabsList>
        <TabsTrigger value="incoming">
          <Download className="mr-2 size-4" />
          Incoming Webhooks
        </TabsTrigger>
        <TabsTrigger value="outgoing">
          <Send className="mr-2 size-4" />
          Outgoing Webhooks
        </TabsTrigger>
        <TabsTrigger value="resources">
          <Key className="mr-2 size-4" />
          Resource Management
        </TabsTrigger>
        <TabsTrigger value="permissions">
          <Shield className="mr-2 size-4" />
          Permissions
        </TabsTrigger>
        <TabsTrigger value="audit">
          <FileText className="mr-2 size-4" />
          Audit Logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="incoming">
        <WorkspaceIncomingWebhooks workspaceSlug={workspaceSlug} />
      </TabsContent>

      <TabsContent value="outgoing">
        <WorkspaceOutgoingWebhooks workspaceSlug={workspaceSlug} />
      </TabsContent>

      <TabsContent value="resources">
        <WorkspaceResourceManagement workspaceSlug={workspaceSlug} />
      </TabsContent>

      <TabsContent value="permissions">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Permissions</CardTitle>
            <CardDescription>Control which operations webhooks can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Configure granular permissions for webhook operations</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="audit">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Audit Logs</CardTitle>
            <CardDescription>Track all webhook activity and operations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">View detailed logs of webhook executions and changes</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
