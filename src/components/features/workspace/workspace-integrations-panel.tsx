"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  useWorkspaceIntegrations,
  useCreateWorkspaceIntegration,
  useUpdateWorkspaceIntegration,
  useDeleteWorkspaceIntegration,
  useTestWorkspaceIntegration,
} from "@/hooks/api/use-workspaces"
import {
  Plus,
  Trash2,
  Play,
  RefreshCw,
  Check,
  Copy,
  Zap,
  Globe,
  Activity,
  MessageSquare,
  GitBranch,
  Trello,
  Figma,
} from "lucide-react"

interface WorkspaceIntegrationsPanelProps {
  workspaceId: string
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  slack: <MessageSquare className="h-5 w-5" />,
  github: <GitBranch className="h-5 w-5" />,
  gitlab: <GitBranch className="h-5 w-5" />,
  jira: <Trello className="h-5 w-5" />,
  linear: <Activity className="h-5 w-5" />,
  notion: <Globe className="h-5 w-5" />,
  figma: <Figma className="h-5 w-5" />,
  discord: <MessageSquare className="h-5 w-5" />,
  teams: <MessageSquare className="h-5 w-5" />,
  zapier: <Zap className="h-5 w-5" />,
  make: <Zap className="h-5 w-5" />,
  custom: <Globe className="h-5 w-5" />,
}

export function WorkspaceIntegrationsPanel({ workspaceId }: WorkspaceIntegrationsPanelProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedService, setSelectedService] = useState("")
  const [configForm, setConfigForm] = useState<Record<string, any>>({})
  const [testingId, setTestingId] = useState<string | null>(null)

  const { data, isLoading } = useWorkspaceIntegrations(workspaceId)
  const createIntegration = useCreateWorkspaceIntegration(workspaceId)
  const updateIntegration = useUpdateWorkspaceIntegration(workspaceId)
  const deleteIntegration = useDeleteWorkspaceIntegration(workspaceId)
  const testIntegration = useTestWorkspaceIntegration(workspaceId)

  const integrations = data?.integrations || []
  const availableServices = data?.availableServices || []

  const handleCreate = async () => {
    if (!selectedService || !configForm.name) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const result = await createIntegration.mutateAsync({
        service: selectedService,
        name: configForm.name,
        config: configForm,
        description: configForm.description,
      })

      toast.success("Integration created", {
        description: "Store the secret key securely - it won't be shown again.",
      })

      if (result.secret) {
        navigator.clipboard.writeText(result.secret)
        toast.info("Secret copied to clipboard")
      }

      setIsAddOpen(false)
      setSelectedService("")
      setConfigForm({})
    } catch (error) {
      toast.error("Failed to create integration")
    }
  }

  const handleTest = async (integrationId: string) => {
    setTestingId(integrationId)
    try {
      const result = await testIntegration.mutateAsync(integrationId)
      if (result.success) {
        toast.success("Integration test passed", {
          description: `Latency: ${result.latency}ms`,
        })
      } else {
        toast.error("Integration test failed", {
          description: result.message,
        })
      }
    } catch (error) {
      toast.error("Test failed")
    } finally {
      setTestingId(null)
    }
  }

  const handleToggle = async (integrationId: string, active: boolean) => {
    try {
      await updateIntegration.mutateAsync({
        integrationId,
        data: { active },
      })
      toast.success(active ? "Integration enabled" : "Integration disabled")
    } catch (error) {
      toast.error("Failed to update integration")
    }
  }

  const handleDelete = async (integrationId: string) => {
    try {
      await deleteIntegration.mutateAsync(integrationId)
      toast.success("Integration deleted")
    } catch (error) {
      toast.error("Failed to delete integration")
    }
  }

  const selectedServiceMeta = availableServices.find((s: any) => s.id === selectedService)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Integrations</h3>
          <p className="text-sm text-muted-foreground">Connect third-party services to your workspace</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Integration</DialogTitle>
              <DialogDescription>
                Connect a third-party service to receive notifications and sync data
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="select" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="select">Select Service</TabsTrigger>
                <TabsTrigger value="configure" disabled={!selectedService}>
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
                          selectedService === service.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedService(service.id)}
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
                            <p className="text-xs text-muted-foreground">
                              {service.events.length === 1 && service.events[0] === "*"
                                ? "All events"
                                : `${service.events.length} events`}
                            </p>
                          </div>
                          {selectedService === service.id && <Check className="ml-auto h-5 w-5 text-primary" />}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="configure" className="mt-4 space-y-4">
                {selectedServiceMeta && (
                  <>
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${selectedServiceMeta.color}20` }}
                      >
                        {SERVICE_ICONS[selectedService] || <Globe className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{selectedServiceMeta.name}</p>
                        <p className="text-xs text-muted-foreground">Configure your integration</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Integration Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Production Slack"
                          value={configForm.name || ""}
                          onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="What is this integration for?"
                          value={configForm.description || ""}
                          onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                        />
                      </div>

                      {["slack", "discord", "teams", "custom"].includes(selectedService) && (
                        <div className="space-y-2">
                          <Label htmlFor="webhookUrl">Webhook URL *</Label>
                          <Input
                            id="webhookUrl"
                            placeholder="https://hooks.slack.com/services/..."
                            value={configForm.webhookUrl || ""}
                            onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                          />
                        </div>
                      )}

                      {["github", "gitlab", "jira", "linear", "notion", "figma"].includes(selectedService) && (
                        <div className="space-y-2">
                          <Label htmlFor="accessToken">Access Token *</Label>
                          <Input
                            id="accessToken"
                            type="password"
                            placeholder="Enter your access token"
                            value={configForm.accessToken || ""}
                            onChange={(e) => setConfigForm({ ...configForm, accessToken: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Events to Listen</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedServiceMeta.events.slice(0, 8).map((event: string) => (
                            <label key={event} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="rounded border-input"
                                checked={configForm.events?.includes(event) || false}
                                onChange={(e) => {
                                  const events = configForm.events || []
                                  if (e.target.checked) {
                                    setConfigForm({ ...configForm, events: [...events, event] })
                                  } else {
                                    setConfigForm({
                                      ...configForm,
                                      events: events.filter((ev: string) => ev !== event),
                                    })
                                  }
                                }}
                              />
                              {event}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreate} disabled={createIntegration.isPending}>
                        {createIntegration.isPending ? "Creating..." : "Create Integration"}
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">No Integrations</h3>
            <p className="text-sm text-muted-foreground">Connect third-party services to enhance your workspace</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration: any) => (
            <Card key={integration.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${integration.metadata?.color || "#6366f1"}20` }}
                  >
                    {SERVICE_ICONS[integration.service] || <Globe className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{(integration.config as any)?.name || integration.service}</h4>
                      <Badge variant={integration.active ? "default" : "secondary"}>
                        {integration.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{integration.metadata?.name || integration.service}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(integration.id)}
                    disabled={testingId === integration.id}
                  >
                    {testingId === integration.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Test
                  </Button>

                  <Switch
                    checked={integration.active}
                    onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(integration.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Incoming Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incoming Webhooks</CardTitle>
          <CardDescription>Allow external services to post messages to your workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <code className="text-sm">POST /api/workspaces/{workspaceId}/integrations/incoming</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/api/workspaces/${workspaceId}/integrations/incoming`,
                  )
                  toast.success("URL copied to clipboard")
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Headers required:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <code>Authorization: Bearer YOUR_API_KEY</code> or
              </li>
              <li>
                <code>X-Integration-ID</code> + <code>X-Webhook-Signature</code>
              </li>
            </ul>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Example payload:</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {`{
  "channelId": "optional-channel-id",
  "message": "Hello from external service!",
  "source": "github",
  "event": "push",
  "username": "Bot Name",
  "embeds": []
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
