import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { ArrowRight, BookOpen, Code2, Shield, Zap, RefreshCw, Cpu, Webhook, Bot } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary/10 via-background/50 to-background border-b border-border/10">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/40 to-primary/10 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Shield className="h-3.5 w-3.5" /> Scrymechat Enterprise V3 Docs
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl bg-linear-to-b from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              Enterprise Communication at Scale
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Welcome to the Scrymechat Developer Portal. Build high-performance machine-to-machine integrations, provision multi-tenant workspaces, configure ultra-fast webhooks, and orchestrate custom bots securely.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild className="shadow-lg shadow-primary/20 gap-2 font-semibold">
                <Link to="/api-reference">
                  Explore V3 API <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="font-semibold">
                <Link to="/user-guide">User Guides</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature Navigation Cards */}
      <div className="max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            to="/api-reference"
            className="group relative rounded-2xl border border-border/40 bg-card/60 p-8 transition-all duration-300 hover:bg-muted/40 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Code2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">API Reference</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm sm:text-base">
              Programmatic multi-tenant workspace provisioning, OAuth Organization credentials, channel management, and reactive real-time API endpoints.
            </p>
            <div className="flex items-center text-primary font-semibold text-sm">
              Explore API Reference <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/user-guide"
            className="group relative rounded-2xl border border-border/40 bg-card/60 p-8 transition-all duration-300 hover:bg-muted/40 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">Integration Guides</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm sm:text-base">
              Step-by-step guides for Machine-to-Machine (M2M) server auth, Incoming & Outgoing Webhooks, Bot auto-provisioning, and Custom Message schemas.
            </p>
            <div className="flex items-center text-primary font-semibold text-sm">
              Read Integration Guides <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Quick Topics Section */}
        <div className="mt-16">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Featured Topics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              to="/user-guide/webhooks"
              className="group p-6 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 hover:border-primary/30 transition-all flex items-start gap-4"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Webhook className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">Webhooks Guide</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Incoming tokens, outgoing event dispatches, and HMAC SHA-256 signature verification.
                </p>
              </div>
            </Link>

            <Link
              to="/user-guide/m2m-integration"
              className="group p-6 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 hover:border-primary/30 transition-all flex items-start gap-4"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">M2M Integration</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Organization client credentials, timing-safe authentication, and TypeScript SDK usage.
                </p>
              </div>
            </Link>

            <Link
              to="/user-guide/bot-provisioning"
              className="group p-6 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 hover:border-primary/30 transition-all flex items-start gap-4"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">Bot Provisioning</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  System bot default roles, channel definitions, and slash command handling.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Technical Benefits Grid */}
        <div className="mt-20 border-t border-border/40 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl font-bold tracking-tight mb-3">Engineered for High-Throughput Enterprise</h3>
            <p className="text-sm text-muted-foreground">
              Built from the ground up for low-latency messaging, tenant isolation, and developer satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3 p-6 rounded-xl border border-border/20 bg-card/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-base">Redis-Backed Performance</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                V3 API endpoints feature optimized Redis caching with automated cache-invalidation on data updates.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-xl border border-border/20 bg-card/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-base">Constant-Time Security</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Integrated timing-safe authentication protects secrets against cryptographic timing attacks.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-xl border border-border/20 bg-card/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-base">Automated Webhooks</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Webhooks dispatch workspace events dynamically to callback URLs with strong HMAC SHA-256 verification.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-xl border border-border/20 bg-card/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Cpu className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-base">Provisioning Engines</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seamless workspace lifecycle management: programmatically provision, update, and teardown workspace tenants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
