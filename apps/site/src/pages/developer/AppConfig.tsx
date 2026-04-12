import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Info,
  Bolt,
  Monitor as InstallDesktop,
  Key,
  Calculator as Calculate,
  ShieldCheck as VerifiedUser,
  AlertTriangle as Warning,
  Copy as ContentCopy,
  Check,
  MessageSquare,
  Users as UsersIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

export function AppConfig() {
  const { id } = useParams();
  const { session, isAuthenticated } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/applications/${id}`, {
        headers: {
          Authorization: `Bearer ${session?.session.token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: isAuthenticated && !!id,
  });

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(field);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <>
      <Helmet>
        <title>Bot Configuration | Skryme Developer Portal</title>
      </Helmet>

      <div className="pb-16 px-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-end justify-between mb-10 border-b border-outline-variant/10 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Active
              </span>
              <nav className="flex text-xs text-on-surface-variant gap-2 font-medium">
                <Link to="/developer" className="hover:text-primary transition-colors">
                  Applications
                </Link>
                <span>/</span>
                <span className="text-primary">{app?.name || 'Loading...'}</span>
              </nav>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
              Bot <span className="text-primary">Configuration</span>
            </h2>
            <p className="text-on-surface-variant mt-1 max-w-2xl text-base">
              Production deployment environment for {app?.name || 'your application'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="px-6 py-2.5 rounded-xl font-bold text-sm bg-surface">
              Discard
            </Button>
            <Button className="px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20">
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Core Settings */}
          <div className="col-span-8 space-y-6">
            {/* General Information Block */}
            <section className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-xl">
              <div className="flex items-center gap-2 mb-8">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">General Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Bot Name
                  </label>
                  <Input
                    className="bg-surface-container-low border-outline-variant/20 rounded-xl px-4 py-3 h-auto"
                    defaultValue={app?.name}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Application ID
                  </label>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1 bg-surface-container-low/50 border-outline-variant/10 rounded-xl px-4 py-3 h-auto text-on-surface-variant font-mono text-sm"
                      readOnly
                      defaultValue={app?.clientId}
                    />
                    <button
                      onClick={() => copyToClipboard(app?.clientId, 'clientId')}
                      className="p-3 bg-surface-container-low border border-outline-variant/20 text-on-surface-variant rounded-xl hover:text-primary transition-colors"
                    >
                      {copiedId === 'clientId' ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ContentCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <Textarea
                    className="bg-surface-container-low border-outline-variant/20 rounded-xl px-4 py-3 h-auto min-h-[100px]"
                    defaultValue={app?.description}
                  />
                </div>
              </div>
            </section>

            {/* Privileged Gateway Intents */}
            <section className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Bolt className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">Bot Capabilities (Intents)</h3>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">
                  Privileged
                </span>
              </div>
              <div className="space-y-4">
                {[
                  {
                    title: 'Message Content Intent',
                    desc: 'Required to receive message content in most messages.',
                    icon: MessageSquare,
                  },
                  {
                    title: 'Server Members Intent',
                    desc: 'Required to receive events when members join or leave.',
                    icon: UsersIcon,
                  },
                ].map((intent, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/10"
                  >
                    <div className="flex gap-4">
                      <intent.icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold">{intent.title}</p>
                        <p className="text-xs text-on-surface-variant">{intent.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i === 0} />
                      <div className="w-10 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* Installation Contexts */}
            <section className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-xl">
              <div className="flex items-center gap-2 mb-8">
                <InstallDesktop className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Installation Contexts</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Guild Install', desc: 'Bot can be installed to servers by administrators.', checked: true },
                  { title: 'User Install', desc: 'Bot can be added to individual user profiles.', checked: false },
                ].map((ctx, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-4 bg-surface-container-low border rounded-xl transition-colors',
                      ctx.checked ? 'border-primary/20' : 'border-outline-variant/10'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        defaultChecked={ctx.checked}
                        className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-sm font-bold">{ctx.title}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant pl-6">{ctx.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* OAuth2 Section */}
            <section className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-xl">
              <div className="flex items-center gap-2 mb-8">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">OAuth2 Configuration</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                    Redirect URLs
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        className="flex-1 bg-surface-container-low border-outline-variant/20 rounded-xl px-4 py-3 text-sm h-auto"
                        defaultValue="https://support.skryme.com/auth/callback"
                      />
                      <button className="p-3 text-error-dim hover:bg-error-container/10 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <button className="text-primary font-bold text-xs flex items-center gap-1 hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />
                      Add another URL
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sidebar Tools */}
          <div className="col-span-4 space-y-6">
            {/* Permission Integer Calculator */}
            <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10">
              <h5 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Calculate className="w-4 h-4 text-primary" />
                Permissions Calculator
              </h5>
              <div className="space-y-3 mb-6">
                {[
                  { name: 'Administrator', checked: true },
                  { name: 'Manage Channels', checked: false },
                  { name: 'Read Messages', checked: true },
                  { name: 'Send Messages', checked: true },
                ].map(perm => (
                  <div
                    key={perm.name}
                    className="flex items-center justify-between text-xs p-2 hover:bg-surface rounded transition-colors group"
                  >
                    <span className="text-on-surface-variant group-hover:text-on-surface font-medium">{perm.name}</span>
                    <input
                      type="checkbox"
                      defaultChecked={perm.checked}
                      className="rounded border-outline-variant text-primary w-4 h-4"
                    />
                  </div>
                ))}
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Permission Integer</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-primary font-bold">805306368</span>
                  <ContentCopy className="w-4 h-4 text-primary cursor-pointer hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>

            {/* Bot Status Card */}
            <div className="bg-on-surface rounded-xl p-8 text-white">
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <img
                    alt="Bot Avatar"
                    className="w-20 h-20 rounded-xl object-cover border-2 border-primary/40 shadow-xl"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJZWZQxJ8odt4y4dHB9jtfFMx3fcnJIl2nQmEdjuHMNLUHdNErXE3BfUpBGW3JDy1SJeQa0Wr6z_w0iD-H1KDvk4kecsdfjnL0JDKcMH3GXaThsqP3oz5ufmSp87LUTM0PuWp-WYWTOTx6deLwG-EFZsFBaEUxkVQViJS43I2zrkhnh89DSKUkFgOzLHRa609Jm1cnhCTWgKpQgg6sts2hWQHLGIT9JlIoRmQffc6dpf_t4C0ei6FsvPevHTwvlr1XNZ6WlOQMc9WS"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-on-surface rounded-full"></div>
                </div>
                <h4 className="text-xl font-bold">{app?.name || 'SupportBot'}</h4>
                <p className="text-[10px] text-outline-variant mt-1 uppercase tracking-[0.2em] font-bold">
                  v2.4.0-STABLE
                </p>
                <div className="w-full mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-outline-variant uppercase mb-1">Guilds</p>
                    <p className="text-lg font-bold">1,240</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-outline-variant uppercase mb-1">API Latency</p>
                    <p className="text-lg font-bold text-emerald-400">24ms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Protocol */}
            <div className="bg-surface-container-high/20 p-6 rounded-xl border border-outline-variant/10">
              <h5 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <VerifiedUser className="w-4 h-4 text-primary" />
                Security Protocol
              </h5>
              <ul className="space-y-4">
                {[
                  'Rotate bot tokens every 90 days or if exposure is suspected.',
                  'Use Environment Variables for local development secrets.',
                ].map((step, i) => (
                  <li key={i} className="text-xs flex gap-3 text-on-surface-variant leading-relaxed">
                    <span className="text-primary font-bold">0{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Danger Zone */}
            <div className="bg-error-container/5 p-6 rounded-xl border border-error-container/20">
              <h5 className="text-error font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Warning className="w-4 h-4" />
                Danger Zone
              </h5>
              <Button
                variant="outline"
                className="w-full py-6 bg-white text-error border-error-container/30 rounded-xl font-bold text-xs hover:bg-error hover:text-white transition-all shadow-sm"
              >
                Revoke Bot Token
              </Button>
              <button className="w-full mt-3 py-3 text-error/60 text-[10px] font-bold hover:text-error transition-colors uppercase tracking-widest">
                Delete Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
