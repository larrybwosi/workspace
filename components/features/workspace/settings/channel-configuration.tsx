"use client"

import { useState } from "react"
import { Settings, Shield, Lock, Globe } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"

interface ChannelConfigurationsProps {
  workspaceId: string
}

export function ChannelConfigurations({ workspaceId }: ChannelConfigurationsProps) {
  const [selectedProtocol, setSelectedProtocol] = useState("https")
  const [tlsVersion, setTlsVersion] = useState("1.3")
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)

  // Fetch channels
  const { data: channels, isLoading } = useQuery({
    queryKey: ["workspace-channels", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/channels`)
      if (!res.ok) throw new Error("Failed to fetch channels")
      return res.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading channels...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Channel Configurations</h3>
        <p className="text-sm text-muted-foreground">
          Configure communication protocols and security settings for enterprise integrations
        </p>
      </div>

      {/* Global Communication Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Global Communication Settings</CardTitle>
          <CardDescription>Enterprise-level security and protocol configurations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Communication Protocol</Label>
              <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="https">HTTPS (Recommended)</SelectItem>
                  <SelectItem value="wss">WebSocket Secure (WSS)</SelectItem>
                  <SelectItem value="grpc">gRPC with TLS</SelectItem>
                  <SelectItem value="mqtt">MQTT over TLS</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Protocol used for external service communications</p>
            </div>

            <div className="space-y-2">
              <Label>TLS Version</Label>
              <Select value={tlsVersion} onValueChange={setTlsVersion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.3">TLS 1.3 (Most Secure)</SelectItem>
                  <SelectItem value="1.2">TLS 1.2</SelectItem>
                  <SelectItem value="1.1">TLS 1.1 (Not Recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">End-to-End Encryption</Label>
                <p className="text-sm text-muted-foreground">Encrypt all message payloads before transmission</p>
              </div>
              <Switch checked={encryptionEnabled} onCheckedChange={setEncryptionEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Certificate Validation</Label>
                <p className="text-sm text-muted-foreground">Verify SSL certificates for all external connections</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">IP Whitelisting</Label>
                <p className="text-sm text-muted-foreground">Only accept requests from approved IP addresses</p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel-Specific Settings */}
      <div className="space-y-3">
        <h4 className="font-medium">Channel-Specific Integration Settings</h4>
        {channels?.channels?.map((channel: any) => (
          <Card key={channel.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {channel.private ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    <h4 className="font-semibold">{channel.name}</h4>
                    <Badge variant={channel.private ? "secondary" : "outline"}>
                      {channel.private ? "Private" : "Public"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{channel.description || "No description"}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!channels?.channels || channels.channels.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No channels configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create channels in your workspace to configure integration settings
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
