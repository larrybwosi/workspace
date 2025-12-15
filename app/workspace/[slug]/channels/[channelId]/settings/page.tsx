import type { Metadata } from "next"
import { Webhook, Plus, Trash2, Power, Copy, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export const metadata: Metadata = {
  title: "Channel Settings",
  description: "Manage channel settings and webhooks",
}

export default function ChannelSettingsPage({
  params,
}: {
  params: { slug: string; channelId: string }
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Channel Settings</h1>
            <p className="text-sm text-muted-foreground">Configure channel settings, permissions, and integrations</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Information</CardTitle>
                <CardDescription>Update channel details and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="channel-name">Channel Name</Label>
                  <Input id="channel-name" defaultValue="general" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel-description">Description</Label>
                  <Input id="channel-description" defaultValue="General discussions and updates" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Private Channel</Label>
                    <p className="text-sm text-muted-foreground">Only invited members can access</p>
                  </div>
                  <Switch />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            {/* Webhooks Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Channel Webhooks</h3>
                <p className="text-sm text-muted-foreground">Connect external services to receive channel events</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Channel Webhook</DialogTitle>
                    <DialogDescription>
                      Configure a webhook to receive real-time events from this channel
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook-name">Webhook Name</Label>
                      <Input id="webhook-name" placeholder="e.g., Slack Integration" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input id="webhook-url" type="url" placeholder="https://example.com/webhook" />
                    </div>
                    <div className="space-y-2">
                      <Label>Events to Trigger</Label>
                      <div className="grid gap-3 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="event-message-created" />
                          <label htmlFor="event-message-created" className="text-sm">
                            Message Created
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="event-message-updated" />
                          <label htmlFor="event-message-updated" className="text-sm">
                            Message Updated
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="event-message-deleted" />
                          <label htmlFor="event-message-deleted" className="text-sm">
                            Message Deleted
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="event-member-added" />
                          <label htmlFor="event-member-added" className="text-sm">
                            Member Added
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="event-member-removed" />
                          <label htmlFor="event-member-removed" className="text-sm">
                            Member Removed
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Create Webhook</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Webhooks List */}
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                          <Webhook className="size-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle>Slack Integration {i}</CardTitle>
                            <Badge variant={i === 1 ? "default" : "secondary"}>{i === 1 ? "Active" : "Inactive"}</Badge>
                          </div>
                          <CardDescription className="mt-1">
                            https://hooks.slack.com/services/T00000000/B00000000/...
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Power className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Events</span>
                        <div className="flex gap-2">
                          <Badge variant="outline">Message Created</Badge>
                          <Badge variant="outline">Member Added</Badge>
                          <Badge variant="outline">+2 more</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Fired</span>
                        <span className="text-sm">2 hours ago</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Deliveries</span>
                        <span className="text-sm">1,234</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="text-sm font-medium text-green-600">99.2%</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Webhook Secret</span>
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-2 size-4" />
                            Reveal
                          </Button>
                        </div>
                        <div className="rounded-lg border bg-muted p-3">
                          <code className="text-xs">••••••••••••••••••••••••••••••••</code>
                          <Button variant="ghost" size="icon" className="ml-2 size-6">
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Webhook Documentation */}
            <Card>
              <CardHeader>
                <CardTitle>Webhook Documentation</CardTitle>
                <CardDescription>Learn how to integrate with channel webhooks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium text-sm">Webhook Payload Example</h4>
                  <pre className="rounded-lg border bg-muted p-4 text-xs">
                    {`{
  "event": "message.created",
  "channel_id": "ch_123456",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "message_id": "msg_789",
    "content": "Hello world",
    "author": {
      "id": "usr_456",
      "name": "John Doe"
    }
  }
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="mb-2 font-medium text-sm">Signature Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    All webhook requests include an <code className="rounded bg-muted px-1">X-Webhook-Signature</code>{" "}
                    header for security verification. Use the webhook secret to validate requests.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Permissions</CardTitle>
                <CardDescription>Configure who can perform actions in this channel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Send Messages</Label>
                      <p className="text-sm text-muted-foreground">Who can send messages</p>
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members</SelectItem>
                        <SelectItem value="admins">Admins Only</SelectItem>
                        <SelectItem value="owner">Owner Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Add Members</Label>
                      <p className="text-sm text-muted-foreground">Who can add new members</p>
                    </div>
                    <Select defaultValue="admins">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members</SelectItem>
                        <SelectItem value="admins">Admins Only</SelectItem>
                        <SelectItem value="owner">Owner Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Pin Messages</Label>
                      <p className="text-sm text-muted-foreground">Who can pin messages</p>
                    </div>
                    <Select defaultValue="admins">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members</SelectItem>
                        <SelectItem value="admins">Admins Only</SelectItem>
                        <SelectItem value="owner">Owner Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button>Save Permissions</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how members receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Desktop Notifications</Label>
                    <p className="text-sm text-muted-foreground">Show desktop notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email summaries</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mobile Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send push to mobile devices</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
