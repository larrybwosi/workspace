'use client';

import { useState } from 'react';
import { useOrganizationM2mApplications, useCreateM2mApplication, useDeleteM2mApplication } from '@repo/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Key, Shield, Info, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function M2mTab({ orgSlug }: { orgSlug: string }) {
  const { data: applications, isLoading } = useOrganizationM2mApplications(orgSlug);
  const createMutation = useCreateM2mApplication(orgSlug);
  const deleteMutation = useDeleteM2mApplication(orgSlug);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [createdApp, setCreatedApp] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createMutation.mutateAsync({
        name: appName,
        scopes: ['provisioning:workspaces'],
      });
      setCreatedApp(result);
      setAppName('');
      toast.success('M2M Application created');
    } catch (error) {
      toast.error('Failed to create M2M Application');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this M2M application?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('M2M Application deleted');
      } catch (error) {
        toast.error('Failed to delete M2M Application');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  if (isLoading) return <div>Loading M2M applications...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>M2M Applications</CardTitle>
            <CardDescription>
              Manage Machine-to-Machine applications for programmatic access to your organization.
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) setCreatedApp(null);
          }}>
            <DialogTrigger asChild>
              <Button>Create Application</Button>
            </DialogTrigger>
            <DialogContent>
              {!createdApp ? (
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Create M2M Application</DialogTitle>
                    <DialogDescription>
                      Give your application a name to identify it.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="e.g. CI/CD Pipeline"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <div className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Application Created</DialogTitle>
                    <DialogDescription className="text-destructive font-medium">
                      Copy your client secret now. It will not be shown again!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <div className="flex gap-2">
                        <Input value={createdApp.clientId} readOnly />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(createdApp.clientId)}>
                          <Copy className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Client Secret</Label>
                      <div className="flex gap-2">
                        <Input value={createdApp.clientSecret} type="password" readOnly />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(createdApp.clientSecret)}>
                          {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                        </Button>
                      </div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client ID</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell className="font-mono text-xs">{app.clientId}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {app.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-[10px]">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(app.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!applications || applications.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No M2M applications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <CardTitle className="text-lg">Security & Scopes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <p>
              M2M applications use the <strong>OAuth2 Client Credentials flow</strong>.
              They are intended for server-side integrations that require programmatic access.
            </p>
            <div className="bg-muted p-3 rounded-md flex gap-3">
              <Info className="size-5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Always store your client secret securely. If compromised, delete the application immediately and create a new one.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="size-5 text-primary" />
              <CardTitle className="text-lg">Authentication</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              To get an access token, send a POST request to our token endpoint:
            </p>
            <div className="bg-black text-white p-3 rounded-md font-mono text-[10px] overflow-x-auto">
              curl -X POST /api/v2/oauth/token \<br/>
              &nbsp;&nbsp;-d "grant_type=client_credentials" \<br/>
              &nbsp;&nbsp;-d "client_id=YOUR_CLIENT_ID" \<br/>
              &nbsp;&nbsp;-d "client_secret=YOUR_CLIENT_SECRET"
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'
    } ${className}`}>
      {children}
    </span>
  );
}
