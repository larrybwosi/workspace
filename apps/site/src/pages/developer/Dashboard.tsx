import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@repo/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Bot, Key, Copy, Check } from 'lucide-react';

export function DeveloperDashboard() {
  const { session, isLoading: authLoading, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const copyToClipboard = (text: string, id: string) => {
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
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Applications</h1>
          <Button onClick={() => (document.getElementById('create-app-modal') as any)?.showModal?.()}>
            <Plus className="mr-2 h-4 w-4" /> New Application
          </Button>
        </div>

        {appsLoading ? (
          <div>Loading apps...</div>
        ) : (
          <div className="grid gap-6">
            {apps?.map((app: any) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{app.name}</CardTitle>
                      <CardDescription>{app.description || 'No description provided.'}</CardDescription>
                    </div>
                    {app.bot && (
                       <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                         <Bot className="h-3 w-3" /> Bot Enabled
                       </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client ID</span>
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border group">
                          <code className="text-sm flex-grow truncate">{app.clientId}</code>
                          <button onClick={() => copyToClipboard(app.clientId, app.id + 'id')} className="text-slate-400 hover:text-slate-600">
                            {copiedId === app.id + 'id' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Secret</span>
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border">
                          <code className="text-sm flex-grow truncate">••••••••••••••••</code>
                          <button onClick={() => copyToClipboard(app.clientSecret, app.id + 'secret')} className="text-slate-400 hover:text-slate-600">
                             {copiedId === app.id + 'secret' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {app.bot && (
                      <div className="pt-4 border-t">
                         <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Bot Token</span>
                         <div className="flex items-center gap-2 bg-blue-50/50 p-2 rounded border border-blue-100">
                           <Key className="h-4 w-4 text-blue-500" />
                           <code className="text-sm flex-grow truncate">••••••••••••••••••••••••••••••••</code>
                           <button onClick={() => copyToClipboard(app.bot.botToken, app.id + 'token')} className="text-blue-400 hover:text-blue-600">
                              {copiedId === app.id + 'token' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                           </button>
                         </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {apps?.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed">
                <p className="text-slate-500">You haven't created any applications yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simple Dialog/Modal implementation */}
      <dialog id="create-app-modal" className="p-0 rounded-2xl border shadow-2xl backdrop:bg-slate-900/50">
        <div className="w-[400px] p-6 bg-white">
          <h2 className="text-xl font-bold mb-4">Create New Application</h2>
          <div className="space-y-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Name</label>
               <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="My Awesome Bot" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Description</label>
               <Input value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} placeholder="Short description of what it does" />
             </div>
             <div className="flex gap-3 pt-4">
               <Button variant="outline" className="flex-1" onClick={() => (document.getElementById('create-app-modal') as any).close()}>Cancel</Button>
               <Button className="flex-1" disabled={!name || createMutation.isPending} onClick={() => {
                 createMutation.mutate({ name, description });
                 (document.getElementById('create-app-modal') as any).close();
               }}>
                 {createMutation.isPending ? 'Creating...' : 'Create'}
               </Button>
             </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
