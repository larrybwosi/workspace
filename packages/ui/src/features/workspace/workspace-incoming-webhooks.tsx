'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/card';
import { Button } from '../../components/button';
import { Plus, Trash2, Copy, Check, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/dialog';
import { Input } from '../../components/input';
import { Label } from '../../components/label';
import { Textarea } from '../../components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/select';
import { Badge } from '../../components/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, useWorkspaceChannels } from '@repo/api-client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/table';

interface WorkspaceIncomingWebhooksProps {
  workspaceSlug: string;
}

export function WorkspaceIncomingWebhooks({ workspaceSlug }: WorkspaceIncomingWebhooksProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [copiedKeyMap, setCopiedKeyMap] = useState<Record<string, boolean>>({});

  // Credentials of newly created webhook to display once
  const [createdWebhook, setCreatedSecretWebhook] = useState<{
    token: string;
    secret: string;
    channelName?: string;
  } | null>(null);

  // 1. Fetch channels for the workspace
  const { data: channels, isLoading: channelsLoading } = useWorkspaceChannels(workspaceSlug);

  // 2. Fetch all incoming webhooks in workspace
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['workspace-incoming-webhooks', workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v3/workspaces/${workspaceSlug}/incoming-webhooks`);
      return data;
    },
  });

  const webhooks = responseData?.data?.webhooks || [];

  // 3. Create incoming webhook mutation
  const createWebhook = useMutation({
    mutationFn: async ({ channelId, payload }: { channelId: string; payload: { name: string; description?: string } }) => {
      const { data } = await apiClient.post(
        `/v3/workspaces/${workspaceSlug}/channels/${channelId}/incoming-webhooks`,
        payload
      );
      return data;
    },
    onSuccess: (res: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-incoming-webhooks', workspaceSlug] });
      toast.success('Incoming webhook created successfully');
      setCreateDialogOpen(false);
      setName('');
      setDescription('');
      setSelectedChannelId('');

      if (res?.data?.webhook) {
        const channelObj = channels?.find((c: any) => c.id === variables.channelId);
        setCreatedSecretWebhook({
          token: res.data.webhook.token,
          secret: res.data.webhook.secret,
          channelName: channelObj?.name,
        });
      }
    },
    onError: () => {
      toast.error('Failed to create incoming webhook');
    },
  });

  // 4. Delete incoming webhook mutation
  const deleteWebhook = useMutation({
    mutationFn: async ({ channelId, webhookId }: { channelId: string; webhookId: string }) => {
      await apiClient.delete(
        `/v3/workspaces/${workspaceSlug}/channels/${channelId}/incoming-webhooks/${webhookId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-incoming-webhooks', workspaceSlug] });
      toast.success('Incoming webhook deleted');
    },
    onError: () => {
      toast.error('Failed to delete incoming webhook');
    },
  });

  const getBaseUrl = () => {
    return typeof window !== 'undefined' ? window.location.origin : 'https://api.chat.scryme.tech';
  };

  const getTriggerUrl = (token: string) => {
    return `${getBaseUrl()}/api/v3/webhooks/incoming/${token}`;
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyMap(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedKeyMap(prev => ({ ...prev, [key]: false }));
    }, 2000);
    toast.success('Copied to clipboard');
  };

  const handleCreate = () => {
    if (!name.trim() || !selectedChannelId) return;
    createWebhook.mutate({
      channelId: selectedChannelId,
      payload: { name: name.trim(), description: description.trim() || undefined },
    });
  };

  return (
    <>
      {/* Newly Created Webhook Alert */}
      {createdWebhook && (
        <Card className="border-green-500/50 bg-green-500/10 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle2 className="size-5" />
              Incoming Webhook Created Successfully!
            </CardTitle>
            <CardDescription className="text-green-700 font-medium">
              Copy the token and trigger URL below now. For security reasons, the signing secret cannot be displayed again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-green-700">Webhook Trigger URL (Option A - Token in URL)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm break-all border">
                  {getTriggerUrl(createdWebhook.token)}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(getTriggerUrl(createdWebhook.token), 'created-url')}
                >
                  {copiedKeyMap['created-url'] ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-green-700">Webhook Token</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm break-all border">
                  {createdWebhook.token}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(createdWebhook.token, 'created-token')}
                >
                  {copiedKeyMap['created-token'] ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-green-700">Signing Secret</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm break-all border">
                  {createdWebhook.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(createdWebhook.secret, 'created-secret')}
                >
                  {copiedKeyMap['created-secret'] ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" className="border-green-600/50" onClick={() => setCreatedSecretWebhook(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incoming Webhooks</CardTitle>
              <CardDescription>Receive data from external services to post messages directly into channels</CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Create Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading webhooks...</div>
          ) : webhooks && webhooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead>Last Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook: any) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{webhook.name}</div>
                        {webhook.description && (
                          <div className="text-xs text-muted-foreground">{webhook.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{webhook.channel?.name || 'channel'}</Badge>
                    </TableCell>
                    <TableCell>
                      {webhook.isActive ? (
                        <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{webhook.totalReceived || 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {webhook.lastReceivedAt ? new Date(webhook.lastReceivedAt).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(getTriggerUrl(webhook.token), `url-${webhook.id}`)}
                          title="Copy Trigger URL"
                        >
                          {copiedKeyMap[`url-${webhook.id}`] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteWebhook.mutate({ channelId: webhook.channelId, webhookId: webhook.id })}
                          disabled={deleteWebhook.isPending}
                          title="Delete Webhook"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No incoming webhooks configured yet</p>
              <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Incoming Webhook</DialogTitle>
            <DialogDescription>Configure a webhook to post messages to a workspace channel</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-name">Webhook Name</Label>
              <Input
                id="webhook-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. GitHub Deployment Bot"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-select">Target Channel</Label>
              <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                <SelectTrigger id="channel-select">
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {channelsLoading ? (
                    <SelectItem value="loading" disabled>Loading channels...</SelectItem>
                  ) : channels && channels.length > 0 ? (
                    channels.map((channel: any) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        #{channel.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No channels available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-desc">Description (Optional)</Label>
              <Textarea
                id="webhook-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Posts build notifications from our CI/CD pipeline"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createWebhook.isPending || !name.trim() || !selectedChannelId}
            >
              {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
