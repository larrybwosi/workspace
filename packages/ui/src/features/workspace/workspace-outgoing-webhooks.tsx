'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/card';
import { Button } from '../../components/button';
import { Plus, Trash2, CheckCircle2, XCircle, Key } from 'lucide-react';
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
import { Checkbox } from '../../components/checkbox';
import { Badge } from '../../components/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@repo/api-client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/table';

interface WorkspaceOutgoingWebhooksProps {
  workspaceSlug: string;
}

const AVAILABLE_EVENTS = [
  { id: 'message.sent', label: 'Message Sent', description: 'Triggered when a message is posted in a channel' },
  { id: 'channel.created', label: 'Channel Created', description: 'Triggered when a new channel is created' },
  { id: 'member.added', label: 'Member Added', description: 'Triggered when a member joins the workspace' },
];

export function WorkspaceOutgoingWebhooks({ workspaceSlug }: WorkspaceOutgoingWebhooksProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['message.sent']);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['workspace-outgoing-webhooks', workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/webhooks`);
      return data;
    },
  });

  // Create webhook
  const createWebhook = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post(`/workspaces/${workspaceSlug}/webhooks`, data);
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-outgoing-webhooks', workspaceSlug] });
      toast.success('Outgoing webhook created successfully');
      setCreateDialogOpen(false);
      if (data?.secret) {
        setCreatedSecret(data.secret);
      }
      setName('');
      setUrl('');
      setSelectedEvents(['message.sent']);
    },
    onError: () => {
      toast.error('Failed to create webhook');
    },
  });

  // Delete webhook
  const deleteWebhook = useMutation({
    mutationFn: async (webhookId: string) => {
      await apiClient.delete(`/workspaces/${workspaceSlug}/webhooks/${webhookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-outgoing-webhooks', workspaceSlug] });
      toast.success('Webhook deleted');
    },
    onError: () => {
      toast.error('Failed to delete webhook');
    },
  });

  // Toggle active status
  const toggleWebhook = useMutation({
    mutationFn: async ({ webhookId, active }: { webhookId: string; active: boolean }) => {
      await apiClient.patch(`/workspaces/${workspaceSlug}/webhooks/${webhookId}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-outgoing-webhooks', workspaceSlug] });
      toast.success('Webhook updated');
    },
    onError: () => {
      toast.error('Failed to update webhook');
    },
  });

  const handleCreate = () => {
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) return;
    createWebhook.mutate({ name, url, events: selectedEvents });
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Outgoing Webhooks</CardTitle>
              <CardDescription>Send real-time workspace events to external HTTP endpoints</CardDescription>
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
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook: any) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">{webhook.url}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events?.map((evt: string) => (
                          <Badge key={evt} variant="outline" className="text-xs">
                            {evt}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.active !== false ? (
                        <Badge variant="default" className="gap-1 cursor-pointer" onClick={() => toggleWebhook.mutate({ webhookId: webhook.id, active: false })}>
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleWebhook.mutate({ webhookId: webhook.id, active: true })}>
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWebhook.mutate(webhook.id)}
                        disabled={deleteWebhook.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No outgoing webhooks configured yet</p>
              <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secret Modal */}
      <Dialog open={!!createdSecret} onOpenChange={() => setCreatedSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Webhook Signing Secret
            </DialogTitle>
            <DialogDescription>
              Copy your HMAC signing secret below. Use it to verify X-Webhook-Signature headers on incoming HTTP requests.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Signing Secret</Label>
            <div className="p-3 bg-muted rounded font-mono text-xs break-all select-all border">
              {createdSecret}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              if (createdSecret) {
                navigator.clipboard.writeText(createdSecret);
                toast.success('Secret copied to clipboard');
              }
              setCreatedSecret(null);
            }}>
              Copy & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Outgoing Webhook</DialogTitle>
            <DialogDescription>Configure a destination URL to receive event payloads</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Webhook Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Production Dispatcher"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Payload URL</Label>
              <Input
                id="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/api/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>Subscribed Events</Label>
              <div className="space-y-2 border rounded-md p-3">
                {AVAILABLE_EVENTS.map(event => (
                  <div key={event.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => handleEventToggle(event.id)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                        {event.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createWebhook.isPending || !name || !url || selectedEvents.length === 0}>
              {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
