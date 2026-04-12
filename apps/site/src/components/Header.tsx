import { Link } from 'react-router';
import { Button } from '@repo/ui/components/button';
import { Layout } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/6">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Layout className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight">Workspace</span>
          </Link>
          <nav className="ml-8 hidden md:flex gap-6">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-blue-600">
              Product
            </Link>
            <Link to="/pricing" className="text-sm font-medium transition-colors hover:text-blue-600">
              Pricing
            </Link>
            <Link to="/developer" className="text-sm font-medium transition-colors hover:text-blue-600">
              Developers
            </Link>
            <Link to="/contact" className="text-sm font-medium transition-colors hover:text-blue-600">
              Contact
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <a href={`${import.meta.env.VITE_WEB_URL}/login`}>Log in</a>
          </Button>
          <Button asChild>
            <a href={`${import.meta.env.VITE_WEB_URL}/signup`}>Get Started</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
