"use client"

import * as React from "react"
import { Key, Webhook, Plus, Copy, Trash2, Eye, EyeOff, RefreshCw, Activity, Shield, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TopBar } from "@/components/layout/top-bar"
import { IntegrationStats } from "@/components/features/admin/integration-stats"
import { ApiKeysPanel } from "@/components/features/admin/api-keys-panel"
import { WebhooksPanel } from "@/components/features/admin/webhooks-panel"

export default function IntegrationsPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("api-keys")

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          channelName="API Keys & Webhooks"
          channelDescription="Manage integrations, API access, and webhooks"
        />

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Zap className="h-8 w-8 text-primary" />
                  Integrations & API Access
                </h1>
                <p className="text-muted-foreground mt-1">
                  Create API keys for programmatic access and configure webhooks for real-time events
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <IntegrationStats />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="api-keys" className="gap-2">
                  <Key className="h-4 w-4" />
                  API Keys
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhooks
                </TabsTrigger>
              </TabsList>

              <TabsContent value="api-keys" className="mt-6">
                <ApiKeysPanel />
              </TabsContent>

              <TabsContent value="webhooks" className="mt-6">
                <WebhooksPanel />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
