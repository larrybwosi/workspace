import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="container relative py-12">
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
          Everything you need to master the platform.
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
          Comprehensive guides for users and a powerful API reference for developers.
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
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4">User Guide</h2>
          <p className="text-muted-foreground mb-6">
            Learn how to use the app, manage your workspace, and communicate with your team.
          </p>
          <ul className="space-y-2">
            <li><Link to="/user-guide/joining-workspace" className="text-primary hover:underline">Joining a Workspace</Link></li>
            <li><Link to="/user-guide/sending-messages" className="text-primary hover:underline">Sending Messages</Link></li>
            <li><Link to="/user-guide/making-calls" className="text-primary hover:underline">Making Calls</Link></li>
          </ul>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4">API Reference</h2>
          <p className="text-muted-foreground mb-6">
            Deep dive into our V2 API. Learn about authentication, endpoints, and webhooks.
          </p>
          <ul className="space-y-2">
            <li><Link to="/api-reference/authentication" className="text-primary hover:underline">Authentication (OAuth2)</Link></li>
            <li><Link to="/api-reference/messages" className="text-primary hover:underline">Messaging API</Link></li>
            <li><Link to="/api-reference/workspaces" className="text-primary hover:underline">Workspace Management</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
