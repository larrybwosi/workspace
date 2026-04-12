import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Info, Key, Copy as ContentCopy, Check, Bot as Smarttoy, Globe as Public,
  Trash2 as Delete, Plus as Add, Lightbulb, AlertTriangle as Warning,
  Eye, EyeOff
} from 'lucide-react';

export function AppSettings() {
  const { id } = useParams();
  const { session, isAuthenticated } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/applications/${id}`, {
         headers: {
           'Authorization': `Bearer ${session?.session.token}`
         }
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
        <title>SupportBot Settings | Skryme Developer Portal</title>
      </Helmet>

      <div className="pb-16 px-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
              <nav className="flex text-xs text-on-surface-variant gap-2 font-medium">
                <Link to="/developer" className="hover:text-primary transition-colors">Applications</Link>
                <span>/</span>
                <span className="text-primary font-semibold">{app?.name || 'SupportBot'}</span>
              </nav>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">{app?.name || 'SupportBot'} <span className="text-secondary">Settings</span></h2>
            <p className="text-on-surface-variant mt-2 max-w-2xl text-lg leading-relaxed">Configure your bot's identity, security tokens, and OAuth2 integration parameters for production deployment.</p>
          </div>
          <Button className="bg-primary text-on-primary px-8 py-6 rounded-full font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95">
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Bento Grid Style Forms */}
          <div className="col-span-8 space-y-8">
            {/* General Information Block */}
            <section className="bg-surface-container-lowest p-8 rounded-xl relative overflow-hidden border border-outline-variant/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full"></div>
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">General Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Bot Name</label>
                  <Input className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 h-auto focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all text-on-surface font-medium" defaultValue={app?.name} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Application ID</label>
                  <div className="flex gap-2">
                    <Input className="flex-1 bg-surface-container-low/50 border-none rounded-xl px-4 py-3 h-auto text-on-surface-variant font-mono text-sm cursor-not-allowed" readOnly defaultValue={app?.clientId} />
                    <button onClick={() => copyToClipboard(app?.clientId, 'clientId')} className="p-3 bg-surface-container-high text-primary rounded-xl hover:bg-primary hover:text-white transition-colors">
                      {copiedId === 'clientId' ? <Check className="w-4 h-4" /> : <ContentCopy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Description</label>
                  <Textarea className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 h-auto min-h-[100px] focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all text-on-surface font-medium" defaultValue={app?.description} />
                </div>
              </div>
            </section>

            {/* Bot Settings Block */}
            <section className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-6">
                <Smarttoy className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Bot Settings</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Bot Token</label>
                    <span className="text-[10px] bg-error-container/10 text-error-dim px-2 py-0.5 rounded font-bold">Keep this secret!</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        type={showToken ? "text" : "password"}
                        className="w-full bg-surface-container-low/50 border-none rounded-xl px-4 py-3 h-auto text-on-surface-variant font-mono text-sm pr-12"
                        readOnly
                        defaultValue="MTIzNDU2Nzg5MDEyMzQ1Njc4OTAuR29vZC5Cb3QuVGVzdC5Ub2tlbg=="
                      />
                      <button
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button variant="outline" className="px-4 py-6 bg-surface-container-high border-none text-primary rounded-xl font-bold text-xs hover:bg-primary-container transition-colors h-auto">Reset</Button>
                    <Button onClick={() => copyToClipboard("MTIzNDU2Nzg5MDEyMzQ1Njc4OTAuR29vZC5Cb3QuVGVzdC5Ub2tlbg==", 'token')} className="px-4 py-6 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-2 h-auto">
                      {copiedId === 'token' ? <Check className="w-4 h-4" /> : <ContentCopy className="w-4 h-4" />}
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/10">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Public className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Public Bot</p>
                      <p className="text-xs text-on-surface-variant">Allows anyone to invite this bot to their workspace.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* OAuth2 Section */}
            <section className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-6">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">OAuth2 Configuration</h3>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Redirect URLs</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input className="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-3 h-auto text-sm" defaultValue="https://support.skryme.com/auth/callback" />
                      <button className="p-3 text-error-dim hover:bg-error-container/10 rounded-xl transition-colors">
                        <Delete className="w-5 h-5" />
                      </button>
                    </div>
                    <button className="text-primary font-bold text-xs flex items-center gap-1 hover:underline">
                      <Add className="w-4 h-4" />
                      Add another URL
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Scopes Selection</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['bot', 'identify', 'email', 'messages.read', 'guilds', 'rpc'].map((scope) => (
                      <div key={scope} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-transparent hover:border-primary/20 transition-all cursor-pointer group">
                        <input
                          type="checkbox"
                          defaultChecked={['bot', 'identify', 'messages.read'].includes(scope)}
                          className="rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface">{scope}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Contextual Info & Stats */}
          <div className="col-span-4 space-y-8">
            {/* Bot Preview Card */}
            <div className="bg-on-surface rounded-xl p-8 text-white relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary opacity-20 blur-3xl group-hover:opacity-40 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 mb-4">
                  <img
                    alt="Bot Avatar"
                    className="w-full h-full rounded-full object-cover border-4 border-on-surface"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJZWZQxJ8odt4y4dHB9jtfFMx3fcnJIl2nQmEdjuHMNLUHdNErXE3BfUpBGW3JDy1SJeQa0Wr6z_w0iD-H1KDvk4kecsdfjnL0JDKcMH3GXaThsqP3oz5ufmSp87LUTM0PuWp-WYWTOTx6deLwG-EFZsFBaEUxkVQViJS43I2zrkhnh89DSKUkFgOzLHRa609Jm1cnhCTWgKpQgg6sts2hWQHLGIT9JlIoRmQffc6dpf_t4C0ei6FsvPevHTwvlr1XNZ6WlOQMc9WS"
                  />
                </div>
                <h4 className="text-xl font-bold">{app?.name || 'SupportBot'}</h4>
                <p className="text-xs text-outline-variant mt-1 uppercase tracking-widest">v2.4.0-stable</p>
                <div className="w-full mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-outline-variant uppercase mb-1">Guilds</p>
                    <p className="text-lg font-bold">1,240</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-outline-variant uppercase mb-1">Users</p>
                    <p className="text-lg font-bold">45.2k</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-surface-container-high/40 p-6 rounded-xl border border-outline-variant/10">
              <h5 className="font-bold mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Best Practices
              </h5>
              <ul className="space-y-4">
                {[
                  'Never share your Bot Token on client-side code or public repositories.',
                  'Use the narrowest scopes possible to maintain user trust and security.',
                  'Redirect URLs must be HTTPS unless you are testing on localhost.',
                ].map((tip, i) => (
                  <li key={i} className="text-sm flex gap-3 text-on-surface-variant">
                    <span className="text-primary mt-1 font-bold">0{i+1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Danger Zone */}
            <div className="bg-error-container/5 p-6 rounded-xl border border-error-container/20">
              <h5 className="text-error font-bold mb-4 flex items-center gap-2">
                <Warning className="w-4 h-4" />
                Danger Zone
              </h5>
              <p className="text-xs text-on-surface-variant mb-4">Deleting this application is permanent and cannot be undone. All active tokens will be revoked.</p>
              <Button variant="outline" className="w-full py-6 bg-white text-error border-error-container/30 rounded-xl font-bold text-xs hover:bg-error hover:text-white transition-all h-auto shadow-sm">
                Delete Application
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-2xl shadow-secondary/40 hover:scale-110 transition-transform active:scale-95 group z-50">
        <span className="material-symbols-outlined text-2xl">chat_bubble</span>
        <span className="absolute right-16 bg-on-surface text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Ask SupportBot</span>
      </button>
    </>
  );
}
