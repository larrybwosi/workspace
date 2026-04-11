import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="container relative py-12">
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
          Master Skyrme Chat
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
          Everything you need to know to use Skyrme Chat effectively or build powerful integrations with our V2 API.
        </p>
        <div className="flex w-full items-center justify-center space-x-4 py-4 md:pb-10">
          <Link
            to="/user-guide"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            User Guide
          </Link>
          <Link
            to="/api-reference"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            API Reference
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 transition-all hover:shadow-md">
          <h2 className="text-2xl font-bold mb-4">User Guide</h2>
          <p className="text-muted-foreground mb-6">
            New to Skyrme Chat? Learn how to join a workspace, send messages, and make calls with your team.
          </p>
          <ul className="space-y-3">
            <li><Link to="/user-guide/joining-workspace" className="text-primary hover:underline flex items-center"><span>Joining a Workspace</span></Link></li>
            <li><Link to="/user-guide/sending-messages" className="text-primary hover:underline flex items-center"><span>Sending Messages</span></Link></li>
            <li><Link to="/user-guide/making-calls" className="text-primary hover:underline flex items-center"><span>Making Calls</span></Link></li>
          </ul>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 transition-all hover:shadow-md">
          <h2 className="text-2xl font-bold mb-4">API Reference</h2>
          <p className="text-muted-foreground mb-6">
            Build custom bots and automations. Explore our comprehensive REST API and learn how to sync your data.
          </p>
          <ul className="space-y-3">
            <li><Link to="/api-reference/getting-started" className="text-primary hover:underline flex items-center"><span>Getting Started</span></Link></li>
            <li><Link to="/api-reference/authentication" className="text-primary hover:underline flex items-center"><span>Authentication & Scopes</span></Link></li>
            <li><Link to="/api-reference/recipe-bot" className="text-primary hover:underline flex items-center"><span>Recipe: Build a Bot</span></Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
