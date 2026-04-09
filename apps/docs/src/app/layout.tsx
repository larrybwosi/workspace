import './globals.css';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import Link from 'next/link';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 hidden md:flex">
                <Link className="mr-6 flex items-center space-x-2" href="/">
                  <span className="hidden font-bold sm:inline-block">
                    App Documentation
                  </span>
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/user-guide">User Guide</Link>
                  <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/api-reference">API Reference</Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="py-6 md:px-8 md:py-0 border-t">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built for developers and users.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
