"use client"

import { useState } from "react"
import { Plus, Trash2, Power, PowerOff, SettingsIcon, ExternalLink, Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/card"
import { Button } from "../../../components/button"
import { Badge } from "../../../components/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/dialog"
import { Input } from "../../../components/input"
import { Label } from "../../../components/label"
import { Textarea } from "../../../components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/select"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../../../hooks/use-toast"
import { Switch } from "../../../components/switch"
import { useWorkspaceChannels } from "@repo/api-client"

interface ExternalIntegrationsProps {
  workspaceId: string
}

export function ExternalIntegrations({ workspaceId }: ExternalIntegrationsProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    service: "",
    name: "",
    description: "",
    webhookUrl: "",
    hulyUrl: "",
    channelId: "",
    projectId: "",
    apiKey: "",
    events: [] as string[],
  })

  // Fetch integrations
  const { data, isLoading } = useQuery({
    queryKey: ["workspace-integrations", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations`)
      if (!res.ok) throw new Error("Failed to fetch integrations")
      return res.json()
    },
  })

  const integrations = data?.integrations || []
  const availableServices = data?.availableServices || []

  const { data: channels } = useWorkspaceChannels(workspaceId)

  // Create integration mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create integration")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceId] })
      setCreateDialogOpen(false)
      setFormData({
        service: "",
        name: "",
        description: "",
        webhookUrl: "",
        hulyUrl: "",
        channelId: "",
        projectId: "",
        apiKey: "",
        events: [],
      })
      toast({
        title: "Integration created",
        description: data.message || "Integration has been created successfully.",
      })
      // Show the secret to the user
      setSelectedIntegration({ ...data, newSecret: data.secret })
      setConfigDialogOpen(true)
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create integration",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Delete integration mutation
  const deleteMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/${integrationId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete integration")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceId] })
      toast({
        title: "Integration deleted",
        description: "Integration has been removed successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete integration",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Toggle integration status mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ integrationId, active }: { integrationId: string; active: boolean }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/${integrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })
      if (!res.ok) throw new Error("Failed to toggle integration")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceId] })
      toast({
        title: "Integration updated",
        description: "Integration status has been updated.",
      })
    },
  })

  const handleCreateIntegration = () => {
    createMutation.mutate({
      service: formData.service,
      name: formData.name,
      description: formData.description,
      config: {
        webhookUrl: formData.webhookUrl,
        hulyUrl: formData.hulyUrl,
        channelId: formData.channelId,
        projectId: formData.projectId,
        apiKey: formData.apiKey,
        events: formData.events,
      },
    })
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
    toast({
      title: "Copied to clipboard",
      description: "Integration secret has been copied.",
    })
  }

  const selectedService = availableServices.find((s: any) => s.id === formData.service)

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading integrations...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">External Services</h3>
          <p className="text-sm text-muted-foreground">Connect external services to your workspace</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Active Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration: any) => (
          <Card key={integration.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center size-10 rounded-lg text-white font-semibold"
                    style={{ backgroundColor: integration.metadata?.color || "#6366F1" }}
                  >
                    {integration.metadata?.icon?.slice(0, 2) || "🔌"}
                  </div>
                  <div>
                    <CardTitle className="text-base">{integration.metadata?.name || integration.service}</CardTitle>
                    <CardDescription className="text-xs">
                      {(integration.config as any)?.name || integration.service}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={integration.active ? "default" : "secondary"}>
                  {integration.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {(integration.config as any)?.description || "No description provided"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setSelectedIntegration(integration)
                    setConfigDialogOpen(true)
                  }}
                >
                  <SettingsIcon className="h-3 w-3 mr-1" />
                  Configure
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMutation.mutate({ integrationId: integration.id, active: !integration.active })}
                  disabled={toggleMutation.isPending}
                >
                  {integration.active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(integration.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <ExternalLink className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No integrations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect external services to automate workflows and enhance collaboration
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Integration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Integration Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>Connect an external service to your workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service: any) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center gap-2">
                        <span>{service.icon}</span>
                        <span>{service.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Integration Name</Label>
              <Input
                placeholder="e.g., Production Slack"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Describe what this integration is used for"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {selectedService && (
              <>
                {selectedService.id === "huly" && (
                  <>
                    <div className="space-y-2">
                      <Label>Huly URL (Self-hosted)</Label>
                      <Input
                        type="url"
                        placeholder="https://huly.your-domain.com"
                        value={formData.hulyUrl}
                        onChange={(e) => setFormData({ ...formData, hulyUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Channel (for Notifications)</Label>
                      <Select
                        value={formData.channelId}
                        onValueChange={(value) => setFormData({ ...formData, channelId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {channels?.map((channel: any) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              # {channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Project ID (Optional)</Label>
                      <Input
                        placeholder="e.g., default-project-id"
                        value={formData.projectId}
                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {selectedService.id !== "custom" && selectedService.id !== "huly" && (
                  <div className="space-y-2">
                    <Label>Webhook URL (Optional)</Label>
                    <Input
                      type="url"
                      placeholder={`https://${selectedService.id}.example.com/webhook`}
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{selectedService.id === "huly" ? "Huly API Token" : "API Key / Access Token (Optional)"}</Label>
                  <Input
                    type="password"
                    placeholder={selectedService.id === "huly" ? "Enter your Huly API token" : "Enter your API key or token"}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  />
                </div>

                {selectedService.events && selectedService.events.length > 0 && (
                  <div className="space-y-2">
                    <Label>Events to Send</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedService.events.map((event: string) => (
                        <div key={event} className="flex items-center space-x-2">
                          <Switch
                            checked={formData.events.includes(event)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, events: [...formData.events, event] })
                              } else {
                                setFormData({ ...formData, events: formData.events.filter((e) => e !== event) })
                              }
                            }}
                          />
                          <Label className="text-sm font-normal">{event}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateIntegration}
                disabled={!formData.service || !formData.name || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Integration"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Integration Configuration</DialogTitle>
            <DialogDescription>
              {selectedIntegration?.newSecret ? "Save your integration secret" : "Manage integration settings"}
            </DialogDescription>
          </DialogHeader>
          {selectedIntegration?.newSecret && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Important: Save your secret
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This secret will only be shown once. Store it securely.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Integration Secret</Label>
                <div className="flex gap-2">
                  <Input value={selectedIntegration.newSecret} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copySecret(selectedIntegration.newSecret)}>
                    {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
          {!selectedIntegration?.newSecret && selectedIntegration && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <p className="text-sm">{selectedIntegration.metadata?.name || selectedIntegration.service}</p>
              </div>
              {selectedIntegration?.service === 'huly' && !selectedIntegration?.newSecret && (
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/integrations/huly/webhook/${selectedIntegration.id}`}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/integrations/huly/webhook/${selectedIntegration.id}`)
                        toast({ title: "Copied", description: "Webhook URL copied to clipboard" })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Paste this URL into your Huly project webhook settings.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedIntegration.active}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ integrationId: selectedIntegration.id, active: checked })
                    }
                  />
                  <span className="text-sm">{selectedIntegration.active ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
