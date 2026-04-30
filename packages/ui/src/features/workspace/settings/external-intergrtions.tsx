"use client"

import { useState } from "react"
import { Plus, Trash2, Power, PowerOff, SettingsIcon, ExternalLink, Copy, Check, Play, Globe, Zap, MessageSquare, GitBranch, Activity, Layout, Pentagon, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/card"
import { Button } from "../../../components/button"
import { Badge } from "../../../components/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/dialog"
import { Input } from "../../../components/input"
import { Label } from "../../../components/label"
import { Textarea } from "../../../components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/tabs"
import { ScrollArea } from "../../../components/scroll-area"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../../../hooks/use-toast"
import { Switch } from "../../../components/switch"
import { useWorkspaceChannels, useWorkspaceIntegrations, useCreateWorkspaceIntegration, useUpdateWorkspaceIntegration, useDeleteWorkspaceIntegration, useTestWorkspaceIntegration, apiClient } from "@repo/api-client"
import { toast } from "sonner"

interface ExternalIntegrationsProps {
  workspaceId: string // This is now treated as workspaceSlug
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  slack: <MessageSquare className="h-5 w-5" />,
  github: <GitBranch className="h-5 w-5" />,
  gitlab: <GitBranch className="h-5 w-5" />,
  jira: <Layout className="h-5 w-5" />,
  linear: <Activity className="h-5 w-5" />,
  notion: <Globe className="h-5 w-5" />,
  figma: <Pentagon className="h-5 w-5" />,
  discord: <MessageSquare className="h-5 w-5" />,
  teams: <MessageSquare className="h-5 w-5" />,
  zapier: <Zap className="h-5 w-5" />,
  make: <Zap className="h-5 w-5" />,
  custom: <Globe className="h-5 w-5" />,
}

export function ExternalIntegrations({ workspaceId: workspaceSlug }: ExternalIntegrationsProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
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
  const { data, isLoading } = useWorkspaceIntegrations(workspaceSlug)

  const integrations = data?.integrations || []
  const availableServices = data?.availableServices || []

  const { data: channels } = useWorkspaceChannels(workspaceSlug)

  // Create integration mutation
  const createMutation = useCreateWorkspaceIntegration(workspaceSlug)

  // Update integration mutation
  const updateMutation = useUpdateWorkspaceIntegration(workspaceSlug)

  // Delete integration mutation
  const deleteMutation = useDeleteWorkspaceIntegration(workspaceSlug)

  // Test integration mutation
  const testIntegration = useTestWorkspaceIntegration(workspaceSlug)

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
    }, {
      onSuccess: (data) => {
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
        toast.success("Integration created successfully")
        // Show the secret to the user
        setSelectedIntegration({ ...data, newSecret: data.secret })
        setConfigDialogOpen(true)
      },
      onError: (error: any) => {
        toast.error("Failed to create integration")
      }
    })
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    deleteMutation.mutate(integrationId, {
      onSuccess: () => {
        toast.success("Integration deleted successfully")
      },
      onError: (error: any) => {
        toast.error("Failed to delete integration")
      }
    })
  }

  const handleToggleIntegration = async (integrationId: string, active: boolean) => {
    updateMutation.mutate({
      integrationId,
      data: { active }
    }, {
      onSuccess: () => {
        toast.success(active ? "Integration enabled" : "Integration disabled")
      }
    })
  }

  const handleTestIntegration = async (integrationId: string) => {
    setTestingId(integrationId)
    try {
      const result = await testIntegration.mutateAsync(integrationId)
      if (result.success) {
        toast.success("Integration test passed")
      } else {
        toast.error("Integration test failed")
      }
    } catch (error) {
      toast.error("Test failed")
    } finally {
      setTestingId(null)
    }
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
    toast.success("Secret copied to clipboard")
  }

  const selectedServiceMeta = availableServices.find((s: any) => s.id === formData.service)

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
                    {SERVICE_ICONS[integration.service] || <Globe className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{(integration.config as any)?.name || integration.service}</CardTitle>
                    <CardDescription className="text-xs">
                      {integration.metadata?.name || integration.service}
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
                  onClick={() => handleToggleIntegration(integration.id, !integration.active)}
                  disabled={updateMutation.isPending}
                >
                  {integration.active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteIntegration(integration.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestIntegration(integration.id)}
                  disabled={testingId === integration.id}
                >
                  {testingId === integration.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
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

          <Tabs defaultValue="select" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select Service</TabsTrigger>
              <TabsTrigger value="configure" disabled={!formData.service}>
                Configure
              </TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 gap-3">
                  {availableServices.map((service: any) => (
                    <Card
                      key={service.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        formData.service === service.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setFormData({ ...formData, service: service.id })}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${service.color}20` }}
                        >
                          {SERVICE_ICONS[service.id] || <Globe className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{service.name}</p>
                        </div>
                        {formData.service === service.id && <Check className="ml-auto h-5 w-5 text-primary" />}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="configure" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Integration Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production Slack"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this integration is used for"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {selectedServiceMeta && (
                  <>
                    {["slack", "discord", "teams", "custom"].includes(formData.service) && (
                      <div className="space-y-2">
                        <Label htmlFor="webhookUrl">Webhook URL *</Label>
                        <Input
                          id="webhookUrl"
                          placeholder="https://hooks.slack.com/services/..."
                          value={formData.webhookUrl}
                          onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                        />
                      </div>
                    )}

                    {formData.service === "huly" && (
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
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>API Key / Access Token (Optional)</Label>
                      <Input
                        type="password"
                        placeholder="Enter your API key or token"
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      />
                    </div>
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
            </TabsContent>
          </Tabs>
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
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedIntegration.active}
                    onCheckedChange={(checked) =>
                      handleToggleIntegration(selectedIntegration.id, checked)
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
