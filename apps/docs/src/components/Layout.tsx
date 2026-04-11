import { Link, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { ThemeToggle, Input, Button } from '@repo/ui';
import { Search, MessageSquare } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link className="flex items-center space-x-2" to="/">
              <span className="font-bold text-xl tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Skyrme Chat <span className="text-muted-foreground font-normal">Docs</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
              <Link
                className={`transition-colors hover:text-foreground ${location.pathname.startsWith('/user-guide') ? 'text-foreground' : 'text-muted-foreground'}`}
                to="/user-guide"
              >
                User Guide
              </Link>
              <Link
                className={`transition-colors hover:text-foreground ${location.pathname.startsWith('/api-reference') ? 'text-foreground' : 'text-muted-foreground'}`}
                to="/api-reference"
              >
                API Reference
              </Link>
            </nav>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="w-full flex-1 md:w-auto md:flex-initial">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <Input
                  placeholder="Search documentation..."
                  className="pl-9 h-9 w-full md:w-[300px] lg:w-[400px] bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
                  <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                <a href="https://github.com/skyrme-chat/skyrme-chat" target="_blank" rel="noreferrer">
                  {/*<GithubIcon className="h-4 w-4" />*/}
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/40 py-12 bg-muted/30">
        <div className="container flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-bold">Skyrme Chat</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              The modern communication platform for teams that value privacy and performance.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://skyrme.chat" className="hover:text-foreground transition-colors">
                    Website
                  </a>
                </li>
                <li>
                  <a href="https://app.skyrme.chat" className="hover:text-foreground transition-colors">
                    Open App
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/user-guide" className="hover:text-foreground transition-colors">
                    User Guide
                  </Link>
                </li>
                <li>
                  <Link to="/api-reference" className="hover:text-foreground transition-colors">
                    API Reference
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Skyrme Chat. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/skyrme-chat/skyrme-chat"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {/*<GithubIcon className="h-4 w-4" />*/}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
