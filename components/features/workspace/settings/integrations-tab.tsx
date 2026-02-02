"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiKeysManagement } from "./api-keys"
import { WebhooksManagement } from "./webhooks-management"
import { ExternalIntegrations } from "./external-intergrtions"
import { ChannelConfigurations } from "./channel-configuration"

interface IntegrationsTabProps {
  workspaceId: string
}

export function IntegrationsTab({ workspaceId }: IntegrationsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrations & API</h2>
        <p className="text-muted-foreground">
          Manage API keys, webhooks, external integrations, and communication channels
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="external">External Services</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-4 mt-6">
          <ApiKeysManagement workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 mt-6">
          <WebhooksManagement workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="external" className="space-y-4 mt-6">
          <ExternalIntegrations workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="channels" className="space-y-4 mt-6">
          <ChannelConfigurations workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
