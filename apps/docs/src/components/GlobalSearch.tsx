import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search as SearchIcon, FileText, Code, ChevronRight } from 'lucide-react';
import { Input, cn } from '@repo/ui';

interface SearchResult {
  title: string;
  slug: string;
  type: 'user-guide' | 'api-reference';
  excerpt: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Mock search data - in a real app this would come from a search index (e.g. Algolia or local Lunr)
  const allContent: SearchResult[] = [
    {
      title: 'Joining a Workspace',
      slug: 'joining-workspace',
      type: 'user-guide',
      excerpt: 'Learn how to accept an invite and join your first workspace.',
    },
    {
      title: 'Sending Messages',
      slug: 'sending-messages',
      type: 'user-guide',
      excerpt: 'Master the art of communication with channels, DMs, and formatting.',
    },
    {
      title: 'Authentication',
      slug: 'authentication',
      type: 'api-reference',
      excerpt: 'How to use OAuth2 client credentials to authenticate your bot.',
    },
    {
      title: 'QR Authentication',
      slug: 'qr-auth',
      type: 'api-reference',
      excerpt: 'Secure cross-device login using mobile QR code scanning.',
    },
    {
      title: 'Discord V10 Gateway',
      slug: 'discord-v10',
      type: 'api-reference',
      excerpt: 'Compatibility layer for discord.js and other Discord libraries.',
    },
    {
      title: 'How to Build a Bot',
      slug: 'recipe-bot',
      type: 'api-reference',
      excerpt: 'A step-by-step guide to creating your first Skyrme Chat bot.',
    },
    {
      title: 'API Explorer',
      slug: 'explorer',
      type: 'api-reference',
      excerpt: 'Interactive documentation for all Skyrme Chat API endpoints.',
    },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const filtered = allContent.filter(
      item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(`/${result.type}/${result.slug}`);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative group">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
        <Input
          placeholder="Search docs..."
          className="pl-9 h-8 w-full md:w-[240px] lg:w-[320px] bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30 text-sm"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full md:w-[400px] right-0 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
          <div className="p-2 max-h-[400px] overflow-y-auto">
            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map(result => (
                  <button
                    key={`${result.type}-${result.slug}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                  >
                    <div className="mt-1 h-8 w-8 shrink-0 flex items-center justify-center rounded bg-primary/10 text-primary">
                      {result.type === 'user-guide' ? <FileText className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm truncate">{result.title}</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">
                          {result.type.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{result.excerpt}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <SearchIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
              </div>
            )}
          </div>
          <div className="p-3 bg-muted/30 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground">
            <span>{results.length} results found</span>
            <div className="flex items-center gap-2">
              <span>
                Press <kbd className="bg-background px-1 rounded border">Esc</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
