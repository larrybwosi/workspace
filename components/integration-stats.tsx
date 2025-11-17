"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Webhook, Activity, TrendingUp } from 'lucide-react'
import { useIntegrationStats } from "@/hooks/api/use-integrations"

export function IntegrationStats() {
  const { data: stats, isLoading } = useIntegrationStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeKeys || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.totalKeys || 0} total keys
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
          <Webhook className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeWebhooks || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.totalWebhooks || 0} total webhooks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">API Calls (24h)</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.apiCalls24h || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.rateLimitUsage || 0}% rate limit used
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Webhook Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.webhookSuccessRate || 0}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Last 100 deliveries
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
