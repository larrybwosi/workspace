import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { ArrowRight, BookOpen, Code2, Rocket, Shield, Zap, RefreshCw, Cpu } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-radial from-primary/5 via-transparent to-transparent">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-primary/30 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="container py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 animate-pulse">
              <Shield className="h-3 w-3" /> Scrymechat Enterprise V3 Release
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl bg-linear-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
              Enterprise Communication at Scale
            </h1>
            <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
              Welcome to the Scrymechat V3 Developer Portal. Build high-performance machine-to-machine integrations, provision multi-tenant workspaces, configure ultra-fast cached webhooks, and manage bots securely.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild className="shadow-lg shadow-primary/20">
                <Link to="/api-reference" className="gap-2">
                  Explore V3 API <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/user-guide">User Guides</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="container pb-24 sm:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            to="/api-reference"
            className="group relative rounded-2xl border border-border/40 bg-card p-8 transition-all hover:bg-muted/50 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Code2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold mb-4">V3 API Reference</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Programmatic provisioning and management for Enterprise. Explore our high-performance endpoints with built-in OAuth credentials on Organizations.
            </p>
            <div className="flex items-center text-primary font-semibold">
              Read API Docs <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/user-guide"
            className="group relative rounded-2xl border border-border/40 bg-card p-8 transition-all hover:bg-muted/50 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Integration Guides</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Learn how to setup machine-to-machine integrations, register high-throughput webhooks, and customize layout schemas.
            </p>
            <div className="flex items-center text-primary font-semibold">
              Explore Guides <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Benefits section */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-4 gap-8 border-t border-border/40 pt-16">
          <div className="space-y-4 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold">Redis-Backed Performance</h3>
            <p className="text-sm text-muted-foreground">
              V3 endpoints feature optimized Redis caching with a 10-minute TTL and automated database cache-invalidation on updates.
            </p>
          </div>
          <div className="space-y-4 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-bold">Constant-Time Security</h3>
            <p className="text-sm text-muted-foreground">
              Integrated timing-safe constant-time authentication to protect client secrets from cryptographic timing attacks.
            </p>
          </div>
          <div className="space-y-4 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RefreshCw className="h-5 w-5" />
            </div>
            <h3 className="font-bold">Automated Webhooks</h3>
            <p className="text-sm text-muted-foreground">
              V3 Webhooks dispatch events dynamically to registered callback URLs, protected by strong HMAC SHA-256 validation.
            </p>
          </div>
          <div className="space-y-4 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold">Provisioning Engines</h3>
            <p className="text-sm text-muted-foreground">
              Seamless organization workspace lifecycle management: programmatically provision, update, and teardown workspace tenants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
