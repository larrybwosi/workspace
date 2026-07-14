'use client';

import { useState } from 'react';
import { Webhook, Copy, Check, Trash2, Plus, ExternalLink, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/card';
import { Badge } from '../../components/badge';
import { Input } from '../../components/input';
import { Label } from '../../components/label';
import { Textarea } from '../../components/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@repo/api-client';
import { toast } from 'sonner';

interface ChannelWebhooksTabProps {
  channelId: string;
  workspaceSlug: string;
}

export function ChannelWebhooksTab({ channelId, workspaceSlug }: ChannelWebhooksTabProps) {
  const queryClient = useQueryClient();
  const [copiedTextMap, setCopiedTextMap] = useState<Record<string, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookDescription, setWebhookDescription] = useState('');

  // Keep track of the newly created webhook so we can show its token and secret once
  const [newWebhookCredentials, setNewWebhookCredentials] = useState<{ token: string; secret: string } | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTextMap(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedTextMap(prev => ({ ...prev, [key]: false }));
    }, 2000);
    toast.success('Copied to clipboard');
  };

  // 1. Fetch channel incoming webhooks
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['channel-incoming-webhooks', workspaceSlug, channelId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v3/workspaces/${workspaceSlug}/channels/${channelId}/incoming-webhooks`);
      return data;
    },
  });

  const webhooks = responseData?.data?.webhooks || [];

  // 2. Create channel incoming webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await apiClient.post(
        `/v3/workspaces/${workspaceSlug}/channels/${channelId}/incoming-webhooks`,
        payload
      );
      return data;
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['channel-incoming-webhooks', workspaceSlug, channelId] });
      toast.success('Incoming webhook created successfully');
      setWebhookName('');
      setWebhookDescription('');
      setIsCreateOpen(false);

      // Store the newly created webhook's token and secret to display to the user
      if (res?.data?.webhook) {
        setNewWebhookCredentials({
          token: res.data.webhook.token,
          secret: res.data.webhook.secret,
        });
      }
    },
    onError: () => {
      toast.error('Failed to create incoming webhook');
    },
  });

  // 3. Delete incoming webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      await apiClient.delete(
        `/v3/workspaces/${workspaceSlug}/channels/${channelId}/incoming-webhooks/${webhookId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-incoming-webhooks', workspaceSlug, channelId] });
      toast.success('Incoming webhook deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete incoming webhook');
    },
  });

  const handleCreateWebhook = () => {
    if (!webhookName.trim()) return;
    createWebhookMutation.mutate({
      name: webhookName,
      description: webhookDescription || undefined,
    });
  };

  const getBaseUrl = () => {
    return typeof window !== 'undefined' ? window.location.origin : 'https://api.example.com';
  };

  const getTriggerUrl = (token: string) => {
    return `${getBaseUrl()}/api/v3/webhooks/incoming/${token}`;
  };

  const getChannelTriggerUrl = () => {
    return `${getBaseUrl()}/api/v3/channels/${channelId}/webhooks/incoming`;
  };

  return (
    <div className="space-y-6">
      {/* Newly Created Webhook Credentials (Alert style - only shown once) */}
      {newWebhookCredentials && (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle2 className="size-5" />
              Webhook Created Successfully!
            </CardTitle>
            <CardDescription className="text-green-700 font-medium">
              Copy the token and secret now. For security reasons, you cannot retrieve them again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-green-700">Webhook URL (Option A - Token in URL)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm break-all">
                  {getTriggerUrl(newWebhookCredentials.token)}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(getTriggerUrl(newWebhookCredentials.token), 'new-url')}
                >
                  {copiedTextMap['new-url'] ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-green-700">Webhook Token</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm break-all">
                  {newWebhookCredentials.token}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newWebhookCredentials.token, 'new-token')}
                >
                  {copiedTextMap['new-token'] ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-green-700">Signing Secret (for signature verification)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm break-all">
                  {newWebhookCredentials.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newWebhookCredentials.secret, 'new-secret')}
                >
                  {copiedTextMap['new-secret'] ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" className="border-green-600/50" onClick={() => setNewWebhookCredentials(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incoming Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incoming Webhooks</CardTitle>
              <CardDescription>Receive messages from external services and applications directly in this channel</CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                      placeholder="e.g. GitHub Alerts"
                      value={webhookName}
                      onChange={e => setWebhookName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-description">Description (Optional)</Label>
                    <Textarea
                      id="webhook-description"
                      placeholder="Receives push notifications from our staging servers"
                      value={webhookDescription}
                      onChange={e => setWebhookDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateWebhook} disabled={createWebhookMutation.isPending || !webhookName}>
                    {createWebhookMutation.isPending ? 'Creating...' : 'Create Webhook'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Webhooks */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Active Webhooks</h3>
            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Loading webhooks...</div>
            ) : webhooks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Deliveries</TableHead>
                    <TableHead>Last Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook: any) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{webhook.name}</div>
                          {webhook.description && (
                            <div className="text-muted-foreground text-xs">{webhook.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {webhook.isActive ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                            <CheckCircle2 className="size-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="size-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{webhook.totalReceived || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {webhook.lastReceivedAt
                          ? new Date(webhook.lastReceivedAt).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                          disabled={deleteWebhookMutation.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 border rounded-lg border-dashed">
                <p className="text-muted-foreground text-sm mb-2">No incoming webhooks configured yet</p>
                <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
                  Create your first webhook
                </Button>
              </div>
            )}
          </div>

          {/* Documentation */}
          <div className="rounded-lg border p-4 bg-muted/40">
            <h3 className="mb-3 font-semibold text-sm flex items-center gap-2">
              <ExternalLink className="size-4 text-indigo-500" />
              Developer Integration Guide
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="mb-2 font-medium text-foreground text-xs uppercase tracking-wider">Option A: Token in URL (Recommended)</p>
                <p className="mb-1 text-xs">Send a direct POST request using the webhook's unique URL:</p>
                <code className="block rounded bg-background p-2 font-mono text-xs overflow-x-auto border">
                  POST {getTriggerUrl('YOUR_WEBHOOK_TOKEN')}
                </code>
              </div>

              <div>
                <p className="mb-2 font-medium text-foreground text-xs uppercase tracking-wider">Option B: Channel URL (Alternative)</p>
                <p className="mb-1 text-xs">Send a POST to the channel trigger endpoint, adding the token to the header:</p>
                <code className="block rounded bg-background p-2 font-mono text-xs overflow-x-auto border mb-2">
                  POST {getChannelTriggerUrl()}
                </code>
                <p className="text-xs">
                  Header: <code className="rounded bg-background px-1 font-mono">x-webhook-token: YOUR_WEBHOOK_TOKEN</code>
                </p>
              </div>

              <div>
                <p className="mb-1 font-medium text-foreground text-xs uppercase tracking-wider">Payload Structure (JSON)</p>
                <p className="mb-2 text-xs">You can customize the webhook name, avatar, and include optional attachments:</p>
                <pre className="rounded bg-background p-3 font-mono text-xs overflow-x-auto border">
{`{
  "content": "Deploy successfully completed on staging environment!",
  "username": "Production Monitor",
  "avatar_url": "https://example.com/avatar.png",
  "attachments": []
}`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
