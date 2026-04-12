import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { ArrowRight, BookOpen, Code2, Rocket, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative isolate">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-linear-to-tr from-primary to-primary/20 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="container py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              Build the future of communication
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Everything you need to integrate Skyrme Chat into your workflow or build powerful bots using our
              developer-first V2 API.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link to="/user-guide" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/api-reference">API Reference</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="container pb-24 sm:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            to="/user-guide"
            className="group relative rounded-2xl border border-border/40 bg-card p-8 transition-all hover:bg-muted/50 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold mb-4">User Guide</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              New to Skyrme Chat? Learn how to join a workspace, send messages, and make calls with your team.
            </p>
            <div className="flex items-center text-primary font-semibold">
              Explore Guide <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/api-reference"
            className="group relative rounded-2xl border border-border/40 bg-card p-8 transition-all hover:bg-muted/50 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Code2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold mb-4">API Reference</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Build custom bots and automations. Explore our comprehensive REST API and learn how to sync your data.
            </p>
            <div className="flex items-center text-primary font-semibold">
              Read API Docs <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Benefits section */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-12 border-t border-border/40 pt-16">
          <div className="space-y-4 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Rocket className="h-5 w-5" />
            </div>
            <h3 className="font-bold">Fast Integration</h3>
            <p className="text-sm text-muted-foreground">
              Get up and running in minutes with our lightweight client libraries and clean API design.
            </p>
          </div>
          <div className="space-y-4 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-bold">Enterprise Security</h3>
            <p className="text-sm text-muted-foreground">
              Built-in support for OAuth2, granular scopes, and webhook signature verification.
            </p>
          </div>
          <div className="space-y-4 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold">Real-time Ready</h3>
            <p className="text-sm text-muted-foreground">
              Leverage our powerful Ably-powered WebSocket layer for instant updates and notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
