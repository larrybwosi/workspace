import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sidebar } from '@/components/sidebar';
import { SyntaxHighlighter, Button, Input, cn } from '@repo/ui';
import { ChevronRight, Github as GithubIcon, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface DocPageProps {
  type: 'user-guide' | 'api-reference';
  defaultSlug?: string;
}

export default function DocPage({ type, defaultSlug }: DocPageProps) {
  const { slug } = useParams();
  const activeSlug = slug || defaultSlug;
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSlug) return;

    setLoading(true);
    const folder = type === 'user-guide' ? 'docs' : 'api';

    // @ts-ignore
    const modules = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' });
    const path = `../content/${folder}/${activeSlug}.md`;

    if (modules[path]) {
      // @ts-ignore
      modules[path]().then((mod: string) => {
        setContent(mod);
        setLoading(false);
      });
    } else {
      setContent(null);
      setLoading(false);
    }
  }, [activeSlug, type]);

  if (!activeSlug && !defaultSlug) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  if (!content) {
    return <div className="container py-10">Page not found</div>;
  }

  const headings = content.match(/^##\s+.+$/gm) || [];
  const toc = headings.map(h => {
    const title = h.replace(/^##\s+/, '');
    const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return { title, id };
  });

  const githubUrl = `https://github.com/skyrme-chat/skyrme-chat/edit/main/apps/docs/src/content/${type === 'user-guide' ? 'docs' : 'api'}/${activeSlug}.md`;

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 pt-10 pb-20">
      <Sidebar type={type} />
      <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_250px]">
        <div className="mx-auto w-full min-w-0">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">Docs</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={type === 'user-guide' ? '/user-guide' : '/api-reference'} className="hover:text-foreground transition-colors">
              {type === 'user-guide' ? 'User Guide' : 'API Reference'}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium capitalize">{activeSlug?.replace(/-/g, ' ')}</span>
          </nav>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ ...props }) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return <h2 id={id} className="group flex items-center" {...props}>
                    {props.children}
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary">#</a>
                  </h2>
                },
                code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      code={String(children).replace(/\n$/, '')}
                      language={match[1]}
                    />
                  ) : (
                    <code className={cn("bg-muted px-1.5 py-0.5 rounded-sm font-mono text-sm", className)} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          <div className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Was this page helpful?</h4>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 px-4">
                  <ThumbsUp className="mr-2 h-4 w-4" /> Yes
                </Button>
                <Button variant="outline" size="sm" className="h-9 px-4">
                  <ThumbsDown className="mr-2 h-4 w-4" /> No
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 text-sm text-muted-foreground">
              <a href={githubUrl} target="_blank" rel="noreferrer" className="flex items-center hover:text-foreground transition-colors">
                <GithubIcon className="mr-2 h-4 w-4" /> Edit this page on GitHub
              </a>
              <a href="https://discord.gg/skyrmechat" target="_blank" rel="noreferrer" className="flex items-center hover:text-foreground transition-colors">
                <MessageCircle className="mr-2 h-4 w-4" /> Join our Discord community
              </a>
            </div>
          </div>
        </div>
        <div className="hidden text-sm xl:block">
          <div className="sticky top-20 -mt-10 pt-4 h-[calc(100vh-5rem)] overflow-y-auto scrollbar-hide">
            <h4 className="font-bold text-xs uppercase tracking-widest text-foreground/70 mb-4 px-2">On This Page</h4>
            <ul className="space-y-1 border-l border-border/40 ml-2">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block py-1.5 pl-4 -ml-[1px] border-l border-transparent text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-12 px-2 pt-8 border-t border-border/40 space-y-6">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Stay Updated</h5>
                <p className="text-xs text-muted-foreground">Subscribe to our developer newsletter for updates.</p>
                <div className="flex gap-2">
                  <Input placeholder="email@example.com" className="h-8 text-xs bg-muted/30 border-none" />
                  <Button size="xs">Join</Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h5 className="text-xs font-bold text-primary mb-1">Need help?</h5>
                <p className="text-[11px] text-muted-foreground mb-3">Our engineers are available to help you integrate Skyrme Chat.</p>
                <Button variant="link" size="xs" className="p-0 h-auto text-primary font-bold">Contact Support &rarr;</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
