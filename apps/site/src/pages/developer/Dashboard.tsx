import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { useState } from 'react';
import { Link } from 'react-router';
import { cn } from '@repo/ui/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useApplications, useCreateApplication, Application } from '@repo/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';

export function DeveloperDashboard() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: apps, isLoading: appsLoading } = useApplications();
  const createMutation = useCreateApplication();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCreateApp = async () => {
    if (!name) return;
    await createMutation.mutateAsync({ name, description });
    setName('');
    setDescription('');
    setIsCreateModalOpen(false);
  };

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

      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <section className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
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
          <div className="flex flex-wrap gap-4">
            <Button
              asChild
              variant="outline"
              className="px-6 py-6 rounded-full font-bold flex items-center gap-2 border-2"
            >
              <a href={import.meta.env.VITE_DOCS_URL} target="_blank" rel="noopener noreferrer">
                <span className="material-symbols-outlined">description</span>
                Documentation
              </a>
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary text-on-primary px-6 py-6 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              <span className="material-symbols-outlined">add_circle</span>
              New Application
            </Button>
          </div>
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
                        'w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden',
                        index % 3 === 0
                          ? 'bg-primary-container text-on-primary-container'
                          : index % 3 === 1
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-tertiary-container text-on-tertiary-container'
                      )}
                    >
                      {app.bot?.avatar ? (
                        <img src={app.bot.avatar} alt={app.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl">
                          {index % 3 === 0 ? 'smart_toy' : index % 3 === 1 ? 'rocket_launch' : 'diversity_3'}
                        </span>
                      )}
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
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs text-on-surface-variant">person</span>
                      </div>
                      <span className="text-xs font-medium text-on-surface-variant">Owner: You</span>
                    </div>
                  </div>
                </Link>
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
                      src="https://images.unsplash.com/photo-1551288049-bbda48658a7d?auto=format&fit=crop&q=80&w=800"
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
              onClick={() => setIsCreateModalOpen(true)}
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Application</DialogTitle>
            <DialogDescription>
              Give your application a name and description to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Application Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Custom Bot"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description (Optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this application do?"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!name || createMutation.isPending}
              onClick={handleCreateApp}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
