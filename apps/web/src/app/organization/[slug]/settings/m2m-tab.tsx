'use client';

import { useState } from 'react';
import {
  useOrganizationM2mApplications,
  useCreateM2mApplication,
  useUpdateM2mApplication,
  useDeleteM2mApplication,
  M2mApplication,
} from '@repo/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, KeyRound, ShieldCheck, Info, Copy, Check, Eye, EyeOff, Plus, Terminal, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_SCOPES = [
  { id: 'provisioning:workspaces', label: 'provisioning:workspaces', description: 'Create & manage workspaces' },
  { id: 'messages:read', label: 'messages:read', description: 'Read messages' },
  { id: 'messages:send', label: 'messages:send', description: 'Send messages & actions' },
  { id: 'channels:read', label: 'channels:read', description: 'List & view channel details' },
  { id: 'channels:write', label: 'channels:write', description: 'Create & manage channels' },
  { id: 'webhooks:read', label: 'webhooks:read', description: 'View webhooks' },
  { id: 'webhooks:write', label: 'webhooks:write', description: 'Provision & update webhooks' },
  { id: 'members:read', label: 'members:read', description: 'Read workspace members' },
  { id: 'members:write', label: 'members:write', description: 'Manage workspace members' },
];

export function M2mTab({ orgSlug }: { orgSlug: string }) {
  const { data: applications, isLoading } = useOrganizationM2mApplications(orgSlug);
  const createMutation = useCreateM2mApplication(orgSlug);
  const updateMutation = useUpdateM2mApplication(orgSlug);
  const deleteMutation = useDeleteM2mApplication(orgSlug);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['provisioning:workspaces']);
  const [allowedIpsText, setAllowedIpsText] = useState('');
  const [createdApp, setCreatedApp] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<'id' | 'secret' | null>(null);
  const [secretVisible, setSecretVisible] = useState(false);

  // Edit dialog state
  const [editingApp, setEditingApp] = useState<M2mApplication | null>(null);
  const [editName, setEditName] = useState('');
  const [editScopes, setEditScopes] = useState<string[]>([]);
  const [editAllowedIpsText, setEditAllowedIpsText] = useState('');

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allowedIps = allowedIpsText
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean);

      const result = await createMutation.mutateAsync({
        name: appName,
        scopes: selectedScopes.length ? selectedScopes : ['provisioning:workspaces'],
        allowedIps,
      });
      setCreatedApp(result);
      setAppName('');
      setSelectedScopes(['provisioning:workspaces']);
      setAllowedIpsText('');
      toast.success('M2M application created');
    } catch (error) {
      toast.error('Failed to create M2M application');
    }
  };

  const openEditDialog = (app: M2mApplication) => {
    setEditingApp(app);
    setEditName(app.name);
    setEditScopes(app.scopes || ['provisioning:workspaces']);
    setEditAllowedIpsText((app.allowedIps || []).join(', '));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    try {
      const allowedIps = editAllowedIpsText
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean);

      await updateMutation.mutateAsync({
        id: editingApp.id,
        name: editName,
        scopes: editScopes.length ? editScopes : ['provisioning:workspaces'],
        allowedIps,
      });
      toast.success('M2M application updated');
      setEditingApp(null);
    } catch (error) {
      toast.error('Failed to update M2M application');
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteMutation.mutateAsync(pendingDeleteId);
      toast.success('M2M application deleted');
    } catch (error) {
      toast.error('Failed to delete M2M application');
    } finally {
      setPendingDeleteId(null);
    }
  };

  const copyToClipboard = (text: string, field: 'id' | 'secret') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>M2M applications</CardTitle>
            <CardDescription>
              Manage machine-to-machine applications for programmatic access to your organization.
            </CardDescription>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) {
                setCreatedApp(null);
                setSecretVisible(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Create application
              </Button>
            </DialogTrigger>
            <DialogContent>
              {!createdApp ? (
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Create M2M application</DialogTitle>
                    <DialogDescription>
                      Give your application a name to identify it later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="e.g. CI/CD pipeline"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Scopes</Label>
                      <p className="text-xs text-muted-foreground">Select the permissions granted to this application.</p>
                      <div className="grid grid-cols-1 gap-2 rounded-md border p-3 max-h-48 overflow-y-auto">
                        {AVAILABLE_SCOPES.map((scope) => (
                          <div key={scope.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`create-scope-${scope.id}`}
                              checked={selectedScopes.includes(scope.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedScopes((prev) => [...prev, scope.id]);
                                } else {
                                  setSelectedScopes((prev) => prev.filter((s) => s !== scope.id));
                                }
                              }}
                            />
                            <div className="grid gap-0.5 leading-none">
                              <label
                                htmlFor={`create-scope-${scope.id}`}
                                className="text-xs font-medium font-mono leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {scope.label}
                              </label>
                              <p className="text-[11px] text-muted-foreground">{scope.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allowedIps">Allowed IPs (Optional)</Label>
                      <Input
                        id="allowedIps"
                        value={allowedIpsText}
                        onChange={(e) => setAllowedIpsText(e.target.value)}
                        placeholder="Comma-separated IP addresses e.g. 192.168.1.1, 10.0.0.1"
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || !appName.trim()}>
                      {createMutation.isPending ? 'Creating…' : 'Create application'}
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <div className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Application created</DialogTitle>
                    <DialogDescription>
                      Copy your client secret now — for your security, it won't be shown again.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <div className="flex gap-2">
                        <Input value={createdApp.clientId} readOnly className="font-mono text-xs" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(createdApp.clientId, 'id')}
                        >
                          {copiedField === 'id' ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Client secret</Label>
                      <div className="flex gap-2">
                        <Input
                          value={createdApp.clientSecret}
                          type={secretVisible ? 'text' : 'password'}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setSecretVisible((v) => !v)}
                        >
                          {secretVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(createdApp.clientSecret, 'secret')}
                        >
                          {copiedField === 'secret' ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                      <Info className="mt-0.5 size-4 shrink-0" />
                      <p>Store this secret in a secure secrets manager. It cannot be retrieved again.</p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={() => setIsCreateDialogOpen(false)}>Done</Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <M2mTableSkeleton />
                ) : !applications || applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <KeyRound className="size-8" />
                        <p className="text-sm font-medium text-foreground">No applications yet</p>
                        <p className="text-xs">Create an M2M application to get started with programmatic access.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{app.clientId}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {app.scopes.map((scope) => (
                            <Badge key={scope} variant="secondary" className="font-mono text-[10px] font-normal">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(app)}
                          >
                            <Pencil className="size-4" />
                            <span className="sr-only">Edit {app.name}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setPendingDeleteId(app.id)}
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Delete {app.name}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <CardTitle className="text-base">Security & scopes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              M2M applications authenticate using the{' '}
              <span className="font-medium text-foreground">OAuth 2.0 client credentials</span> flow, and are
              intended for server-side integrations that need programmatic access without a user in the loop.
            </p>
            <div className="flex items-start gap-3 rounded-md bg-muted p-3">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p className="text-xs">
                Store your client secret securely. If it's ever compromised, delete the application immediately
                and create a new one.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Terminal className="size-5 text-primary" />
              <CardTitle className="text-base">Requesting a token</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Send a <code className="font-mono text-xs">POST</code> request to the token endpoint:
            </p>
            <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-100">
{`curl -X POST /api/v2/oauth/token \\
  -d "grant_type=client_credentials" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET"`}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Edit Application Dialog */}
      <Dialog open={!!editingApp} onOpenChange={(open) => !open && setEditingApp(null)}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit M2M application</DialogTitle>
              <DialogDescription>
                Modify application name, scopes, and IP allowlist restrictions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. CI/CD pipeline"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Scopes</Label>
                <p className="text-xs text-muted-foreground">Select permissions granted to this application.</p>
                <div className="grid grid-cols-1 gap-2 rounded-md border p-3 max-h-48 overflow-y-auto">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div key={scope.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`edit-scope-${scope.id}`}
                        checked={editScopes.includes(scope.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditScopes((prev) => [...prev, scope.id]);
                          } else {
                            setEditScopes((prev) => prev.filter((s) => s !== scope.id));
                          }
                        }}
                      />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor={`edit-scope-${scope.id}`}
                          className="text-xs font-medium font-mono leading-none cursor-pointer"
                        >
                          {scope.label}
                        </label>
                        <p className="text-[11px] text-muted-foreground">{scope.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-allowedIps">Allowed IPs (Optional)</Label>
                <Input
                  id="edit-allowedIps"
                  value={editAllowedIpsText}
                  onChange={(e) => setEditAllowedIpsText(e.target.value)}
                  placeholder="Comma-separated IP addresses e.g. 192.168.1.1, 10.0.0.1"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingApp(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !editName.trim()}>
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke its client credentials. Any service using them will lose access.
              This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function M2mTableSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-24 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
