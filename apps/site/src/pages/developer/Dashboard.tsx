import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { cn } from '@repo/ui/lib/utils';
import { Copy, Check, Key, Plus } from 'lucide-react';

interface BotData {
  id: string;
  name: string;
  botToken?: string;
}

interface Application {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  clientSecret: string;
  bot?: BotData;
}

export function DeveloperDashboard() {
  const { session, isLoading: authLoading, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const queryClient = useQueryClient();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const { data: apps, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/applications`, {
        headers: {
          Authorization: `Bearer ${session?.session.token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (newApp: { name: string; description: string }) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session.token}`,
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

  const resetTokenMutation = useMutation({
    mutationFn: async (appId: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/applications/${appId}/bot/reset-token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.session.token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to reset token');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  if (authLoading) return <div className="p-12 text-center">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-24 text-center">
        <h1 className="text-4xl font-bold mb-4">Developer Portal</h1>
        <p className="text-on-surface-variant mb-8">Please log in to manage your applications.</p>
        <Button asChild size="lg">
          <a href={`${import.meta.env.VITE_WEB_URL}/login?callbackUrl=${window.location.href}`}>
            Log in with Workspace
          </a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Applications | Skryme Developer Portal</title>
      </Helmet>

      <div className="px-12 pb-12">
        {/* Header Section */}
        <section className="mb-12 flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-secondary tracking-widest uppercase mb-2 block">DASHBOARD</span>
            <h2 className="text-4xl font-extrabold text-on-surface -tracking-tight">
              My <span className="text-secondary">Applications</span>
            </h2>
            <p className="text-on-surface-variant mt-2 max-w-lg">
              Manage your automated deployment pipelines, support bots, and organizational tools from a single control
              plane.
            </p>
          </div>
          <Button
            onClick={() => (document.getElementById('create-app-modal') as HTMLDialogElement)?.showModal?.()}
            className="bg-primary text-on-primary px-6 py-6 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Application
          </Button>
        </section>

        {appsLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apps?.map((app: Application, index: number) => (
              <div key={app.id} className="flex flex-col">
                <Link
                  to={`/developer/applications/${app.id}/config`}
                  className="group bg-surface-container-lowest rounded-xl p-8 transition-all hover:bg-white hover:shadow-[0_20px_50px_rgba(45,42,81,0.05)] relative overflow-hidden"
                >
                  <div
                    className={cn(
                      'absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl rounded-bl-full translate-x-12 -translate-y-12 transition-opacity opacity-10 group-hover:opacity-20',
                      index % 3 === 0 ? 'from-primary' : index % 3 === 1 ? 'from-secondary' : 'from-tertiary'
                    )}
                  />
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center',
                        index % 3 === 0
                          ? 'bg-primary-container text-on-primary-container'
                          : index % 3 === 1
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-tertiary-container text-on-tertiary-container'
                      )}
                    >
                      <span className="material-symbols-outlined text-3xl">
                        {index % 3 === 0 ? 'smart_toy' : index % 3 === 1 ? 'rocket_launch' : 'diversity_3'}
                      </span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      Active
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-on-surface">{app.name}</h3>
                  <p className="text-sm text-on-surface-variant mb-6 leading-relaxed line-clamp-2">
                    {app.description || 'AI-powered automation and integration for your Workspace environment.'}
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-surface-container-low">
                    <div className="flex -space-x-2">
                      <img
                        alt="team member"
                        className="w-6 h-6 rounded-full border-2 border-white"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAB79l4V79Aaxj0iqxCsLspNLj1wCyFdwl-nfIL21i70G1VJK_baLKf2_OdgWMuBg6neVKjfGarOrCmLRGkqv4FHG0PjrYO75SUPB3CQpP2INPoPUCJD4NDTE6RyYU3VJA7zTTJc4iU6Gy43psaNGSpTP3UczuJFyQAcHiFtPXYF0Bb_jM0fGu2JxklbfUMxiHSIzVwR90I8XTkZbJKTjeHlPR067Ao5Ek3gvxZrUfZMKCJxw4oSZ8yD2pC5CwD3bMfC0W2FuCnaaJ0"
                      />
                      <img
                        alt="team member"
                        className="w-6 h-6 rounded-full border-2 border-white"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSK-V3ndh1qbyBbB3l4agZ3HMxuVY9zEFZIY4iEzaDxD7q_Tqt_Ieh7b8_FtrzD1Hx4aT7vQRTxcX9Nzr6a8QD2V9WWmJF6wyeJzxdjIwqB9b6cp89uYj2Nxudrgk7SVvak9Qeg8vTtdMUm3v69vzmN1KromYfwMc-YXrvEXWvpqAnsyHAPjdO9PO9iIH-wEpj7NA0SP-csr1YlIuNYNBoDiswGyp2cArUA3n6W4dExK8eFvKhf35CIs7-spgB4gTPLHVPT87VmTuX"
                      />
                    </div>
                  </div>
                </Link>

                {selectedApp?.id === app.id && (
                  <div className="pt-6 border-t bg-slate-50/50 rounded-b-xl px-8 pb-8">
                    <div className="grid gap-8">
                      <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Credentials</h3>
                        <div className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-500 uppercase">Client ID</label>
                              <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border group">
                                <code className="text-sm flex-grow truncate text-slate-600">{app.clientId}</code>
                                <button
                                  onClick={() => copyToClipboard(app.clientId, app.id + 'id')}
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  {copiedId === app.id + 'id' ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-500 uppercase">Client Secret</label>
                              <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border">
                                <code className="text-sm flex-grow truncate text-slate-600">
                                  ••••••••••••••••••••••••••••••••
                                </code>
                                <button
                                  onClick={() => copyToClipboard(app.clientSecret, app.id + 'secret')}
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  {copiedId === app.id + 'secret' ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
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
                                  <button
                                    onClick={() => copyToClipboard(app.bot?.botToken ?? '', app.id + 'token')}
                                    className="text-blue-400 hover:text-blue-600 transition-colors"
                                    title="Copy Token"
                                  >
                                    {copiedId === app.id + 'token' ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure? This will invalidate the existing token.'))
                                        resetTokenMutation.mutate(app.id);
                                    }}
                                    className="text-blue-400 hover:text-blue-600 transition-colors"
                                    title="Reset Token"
                                  >
                                    <Plus className="h-4 w-4 rotate-45" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Keep this token secret. Do not share it or commit it to version control.
                              </p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Featured Float Area */}
            <div className="md:col-span-2 bg-gradient-to-br from-primary to-secondary rounded-xl p-1 w-full relative group">
              <div className="bg-surface-container-lowest h-full w-full rounded-[0.7rem] p-10 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative">
                <div className="flex-1 z-10 text-left">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-extrabold mb-4">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    PLATFORM INSIGHTS
                  </div>
                  <h3 className="text-3xl font-extrabold text-on-surface mb-4 leading-tight">
                    Monitor your <br /> <span className="text-primary">Global Deployment</span>
                  </h3>
                  <p className="text-on-surface-variant mb-8 text-lg">
                    See real-time throughput and error rates across all your active applications in a unified telemetry
                    view.
                  </p>
                  <button className="text-primary font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    View Analytics Hub
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
                <div className="flex-1 relative w-full h-64 md:h-auto">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl h-full border border-surface-container">
                    <img
                      alt="Analytics Dashboard"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8ZMWiHvF2ZIcWV31s3kgjUuNFnGai_DKrkys-lnoBFQ5IqWH6BZN-uqNpCh2IYpNRFNzbPKYpvWqGb3J_xXEdOBvcz04XTtMnmNNc7gSM6MRsZni2FI3ODmbC1FCNuB5ZjFjy6gwjkz6_43IwHPdp95CS1W7KFE0gZC9iwZR0wENgQkIb0aFXYCK0cxh8JerKtgFLWux8uK3mzLb9u5p9rpYAeL-ApwUKAc6GaRvEHDbnxtCYOsgpHLdYj9f4Le5hJuI55cInemqm"
                    />
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/40 max-w-[180px]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-on-surface/60 uppercase tracking-tighter">
                          System Health
                        </span>
                      </div>
                      <div className="text-2xl font-black text-on-surface">99.98%</div>
                      <div className="text-[10px] text-emerald-600 font-bold">+0.02% from last week</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Card */}
            <button
              onClick={() => (document.getElementById('create-app-modal') as HTMLDialogElement)?.showModal?.()}
              className="bg-surface-container-high/50 rounded-xl p-8 flex flex-col justify-center items-center text-center border-2 border-dashed border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-high transition-all group"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Add New Bot</h3>
              <p className="text-sm text-on-surface-variant mb-6 px-4">Ready to automate more of your workflow?</p>
              <div className="bg-on-surface text-surface px-6 py-2 rounded-full text-sm font-bold">Get Started</div>
            </button>
          </div>
        )}
      </div>

      <dialog
        id="create-app-modal"
        className="p-0 rounded-2xl border-0 shadow-2xl backdrop:bg-slate-900/60 transition-all"
      >
        <div className="w-full max-w-md p-8 bg-white">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-headline">Create New Application</h2>
          <p className="text-slate-500 mb-6 text-sm">Give your application a name and description to get started.</p>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Application Name</label>
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="e.g. My Custom Bot"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description (Optional)</label>
              <Input
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                placeholder="What does this application do?"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex gap-3 pt-6">
              <Button
                variant="ghost"
                className="flex-1 h-11"
                onClick={() => (document.getElementById('create-app-modal') as HTMLDialogElement).close()}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11"
                disabled={!name || createMutation.isPending}
                onClick={() => {
                  createMutation.mutate({ name, description });
                  (document.getElementById('create-app-modal') as HTMLDialogElement).close();
                }}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Application'}
              </Button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
