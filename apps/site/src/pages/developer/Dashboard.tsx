import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@repo/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Bot, Key, Copy, Check, Trash2, Settings, ExternalLink } from 'lucide-react';

export function DeveloperDashboard() {
  const { session, isLoading: authLoading, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: apps, isLoading: appsLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/applications`, {
         headers: {
           'Authorization': `Bearer ${session?.session.token}`
         }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (newApp: { name: string, description: string }) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session.token}`
        },
        body: JSON.stringify(newApp),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setName('');
      setDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v2/applications/${id}/delete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.session.token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedApp(null);
    }
  });

  const resetTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/applications/${id}/reset-token`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.session.token}` }
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading) return <div className="container mx-auto py-24 text-center">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-24 text-center">
        <h1 className="text-4xl font-bold mb-4">Developer Portal</h1>
        <p className="text-slate-500 mb-8">Please log in to manage your applications.</p>
        <Button asChild size="lg">
           <a href={`${import.meta.env.VITE_WEB_URL}/login?callbackUrl=${window.location.href}`}>Log in with Workspace</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Developer Portal | Workspace</title>
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Developer Portal</h1>
            <p className="text-slate-500 mt-1">Manage your applications, bots, and integrations.</p>
          </div>
          <Button onClick={() => (document.getElementById('create-app-modal') as any)?.showModal?.()}>
            <Plus className="mr-2 h-4 w-4" /> New Application
          </Button>
        </div>

        {appsLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {apps?.map((app: any) => (
              <Card key={app.id} className={`transition-all ${selectedApp?.id === app.id ? 'ring-2 ring-blue-600' : 'hover:border-slate-300'}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      {app.bot ? <Bot className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{app.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        ID: {app.clientId}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}>
                       {selectedApp?.id === app.id ? 'Close' : 'Manage'}
                     </Button>
                  </div>
                </CardHeader>

                {selectedApp?.id === app.id && (
                  <CardContent className="pt-6 border-t bg-slate-50/50 rounded-b-xl">
                    <div className="grid gap-8">
                       <section>
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Credentials</h3>
                         <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Client ID</label>
                                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border group">
                                  <code className="text-sm flex-grow truncate text-slate-600">{app.clientId}</code>
                                  <button onClick={() => copyToClipboard(app.clientId, app.id + 'id')} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    {copiedId === app.id + 'id' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Client Secret</label>
                                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border">
                                  <code className="text-sm flex-grow truncate text-slate-600">••••••••••••••••••••••••••••••••</code>
                                  <button onClick={() => copyToClipboard(app.clientSecret, app.id + 'secret')} className="text-slate-400 hover:text-slate-600 transition-colors">
                                     {copiedId === app.id + 'secret' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {app.bot && (
                              <div className="space-y-1.5">
                                 <label className="text-xs font-semibold text-slate-500 uppercase">Bot Token</label>
                                 <div className="flex items-center gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                                   <Key className="h-4 w-4 text-blue-500" />
                                   <code className="text-sm flex-grow truncate text-blue-700 font-medium">
                                     {app.bot.botToken ? '••••••••••••••••••••••••••••••••' : 'No token generated'}
                                   </code>
                                   <div className="flex items-center gap-2">
                                     <button onClick={() => copyToClipboard(app.bot.botToken, app.id + 'token')} className="text-blue-400 hover:text-blue-600 transition-colors" title="Copy Token">
                                        {copiedId === app.id + 'token' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                     </button>
                                     <button onClick={() => { if(confirm('Are you sure? This will invalidate the existing token.')) resetTokenMutation.mutate(app.id) }} className="text-blue-400 hover:text-blue-600 transition-colors" title="Reset Token">
                                        <Plus className="h-4 w-4 rotate-45" />
                                     </button>
                                   </div>
                                 </div>
                                 <p className="text-[11px] text-slate-500 mt-1">Keep this token secret. Do not share it or commit it to version control.</p>
                              </div>
                            )}
                         </div>
                       </section>

                       <section className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`${import.meta.env.VITE_WEB_URL}/developer/applications/${app.id}/invite`} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" /> Install Bot
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { if(confirm('Permanently delete this application?')) deleteMutation.mutate(app.id) }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Application
                          </Button>
                       </section>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {apps?.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Bot className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No applications found</h3>
                <p className="text-slate-500 mb-6">Create your first application to start building with Workspace.</p>
                <Button onClick={() => (document.getElementById('create-app-modal') as any)?.showModal?.()}>
                  Create Application
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <dialog id="create-app-modal" className="p-0 rounded-2xl border-0 shadow-2xl backdrop:bg-slate-900/60 transition-all">
        <div className="w-full max-w-md p-8 bg-white">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New Application</h2>
          <p className="text-slate-500 mb-6 text-sm">Give your application a name and description to get started.</p>
          <div className="space-y-5">
             <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700">Application Name</label>
               <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="e.g. My Custom Bot" className="h-11" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700">Description (Optional)</label>
               <Input value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} placeholder="What does this application do?" className="h-11" />
             </div>
             <div className="flex gap-3 pt-6">
               <Button variant="ghost" className="flex-1 h-11" onClick={() => (document.getElementById('create-app-modal') as any).close()}>Cancel</Button>
               <Button className="flex-1 h-11" disabled={!name || createMutation.isPending} onClick={() => {
                 createMutation.mutate({ name, description });
                 (document.getElementById('create-app-modal') as any).close();
               }}>
                 {createMutation.isPending ? 'Creating...' : 'Create Application'}
               </Button>
             </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
