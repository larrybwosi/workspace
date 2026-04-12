import { Link, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { ThemeToggle, Input, Button } from '@repo/ui';
import { Search, MessageSquare } from 'lucide-react';
import { Icons } from './Icons';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/80 backdrop-blur-md">
        <div className="max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link className="flex items-center space-x-2" to="/">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg tracking-tight">
                Skyrme <span className="text-muted-foreground font-medium">Docs</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link
                className={`transition-colors hover:text-foreground ${location.pathname.startsWith('/user-guide') ? 'text-foreground' : 'text-muted-foreground'}`}
                to="/user-guide"
              >
                Guides
              </Link>
              <Link
                className={`transition-colors hover:text-foreground ${location.pathname.startsWith('/api-reference') ? 'text-foreground' : 'text-muted-foreground'}`}
                to="/api-reference"
              >
                API
              </Link>
            </nav>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="w-full flex-1 md:w-auto md:flex-initial">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <Input
                  placeholder="Search..."
                  className="pl-9 h-8 w-full md:w-[240px] lg:w-[320px] bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30 text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
                  <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex">
                    <span>⌘</span>K
                  </kbd>
                </div>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href="https://github.com/skyrme-chat/skyrme-chat" target="_blank" rel="noreferrer">
                  <Icons.gitHub className="h-4.5 w-4.5" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/5 bg-muted/5 py-8 md:py-12">
        <div className="max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div className="col-span-1 md:col-span-1 space-y-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="font-bold tracking-tight">Skyrme Chat</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The modern communication platform for teams that value privacy and performance.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 col-span-1 md:col-span-3 gap-8">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/70">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="https://skyrme.chat" className="hover:text-primary transition-colors">Website</a></li>
                  <li><a href="https://app.skyrme.chat" className="hover:text-primary transition-colors">Open App</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/70">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/user-guide" className="hover:text-primary transition-colors">User Guide</Link></li>
                  <li><Link to="/api-reference" className="hover:text-primary transition-colors">API Reference</Link></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/70">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Skyrme Chat. Built with ❤️ for developers.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/skyrme-chat/skyrme-chat"
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <Icons.gitHub className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
