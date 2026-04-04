"use client"

import { useState } from "react"
import { Webhook, Copy, Check, Trash2, Plus, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

interface ChannelWebhooksTabProps {
  channelId: string
}

export function ChannelWebhooksTab({ channelId }: ChannelWebhooksTabProps) {
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false)
  const [webhookName, setWebhookName] = useState("")
  const [webhookDescription, setWebhookDescription] = useState("")

  const copyToClipboard = async (text: string, type: "token" | "secret") => {
    await navigator.clipboard.writeText(text)
    if (type === "token") {
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    } else {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
    toast.success("Copied to clipboard")
  }

  const handleCreateWebhook = async () => {
    setIsCreatingWebhook(true)
    try {
      const res = await fetch(`/api/channels/${channelId}/webhooks/incoming-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: webhookName, description: webhookDescription }),
      })

      if (res.ok) {
        toast.success("Webhook created successfully")
        setWebhookName("")
        setWebhookDescription("")
      } else {
        toast.error("Failed to create webhook")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsCreatingWebhook(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Incoming Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incoming Webhooks</CardTitle>
              <CardDescription>Receive messages from external services and applications</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Incoming Webhook</DialogTitle>
                  <DialogDescription>Create a webhook to receive messages from external services</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-name">Name</Label>
                    <Input
                      id="webhook-name"
                      placeholder="GitHub Notifications"
                      value={webhookName}
                      onChange={(e) => setWebhookName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-description">Description (Optional)</Label>
                    <Textarea
                      id="webhook-description"
                      placeholder="Receives push notifications from GitHub"
                      value={webhookDescription}
                      onChange={(e) => setWebhookDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateWebhook} disabled={isCreatingWebhook || !webhookName}>
                    Create Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook URL Example */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Webhook className="size-4" />
              <span className="font-medium text-sm">Webhook URL</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm">
                https://api.example.com/channels/{channelId}/webhooks/incoming
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  copyToClipboard(`https://api.example.com/channels/${channelId}/webhooks/incoming`, "token")
                }
              >
                {copiedToken ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Active Webhooks */}
          <div className="space-y-4">
            <h3 className="font-medium">Active Webhooks</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Last Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div>
                      <div className="font-medium">GitHub Webhook</div>
                      <div className="text-muted-foreground text-xs">Push notifications</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>1,234</TableCell>
                  <TableCell className="text-sm text-muted-foreground">2 hours ago</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Documentation */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">How to use</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="mb-1 font-medium text-foreground">1. Send a POST request to the webhook URL</p>
                <p>
                  Include the webhook token in the <code className="rounded bg-muted px-1">x-webhook-token</code> header
                </p>
              </div>
              <div>
                <p className="mb-1 font-medium text-foreground">2. Request body format</p>
                <pre className="mt-2 rounded bg-muted p-2 font-mono text-xs">
                  {`{
  "content": "Message text",
  "username": "Bot Name (optional)",
  "attachments": [] // optional
}`}
                </pre>
              </div>
              <div>
                <p className="mb-1 font-medium text-foreground">3. Optional: Add signature verification</p>
                <p>
                  Include <code className="rounded bg-muted px-1">x-webhook-signature</code> header with HMAC-SHA256
                  signature
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outgoing Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Outgoing Webhooks</CardTitle>
          <CardDescription>Send channel events to external services</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Configure webhooks to send notifications when events occur in this channel
          </p>
          <Button className="mt-4 bg-transparent" variant="outline">
            <ExternalLink className="mr-2 size-4" />
            Configure Outgoing Webhooks
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
