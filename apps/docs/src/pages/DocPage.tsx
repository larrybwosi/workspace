import { useEffect, useState, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sidebar } from '@/components/sidebar';
import { SyntaxHighlighter, Button, Input, cn } from '@repo/ui';
import { Icons } from '@/components/Icons';
import {
  ChevronRight,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Info,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Lightbulb,
  Download,
} from 'lucide-react';


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
    const id = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    return { title, id };
  });

  const githubUrl = `https://github.com/skyrme-chat/skyrme-chat/edit/main/apps/docs/src/content/${type === 'user-guide' ? 'docs' : 'api'}/${activeSlug}.md`;

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSlug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8 flex-1">
      <div className="flex flex-col md:flex-row gap-6 lg:gap-12 py-10">
        <div className="hidden md:block w-[220px] lg:w-[260px] shrink-0 sticky top-24 self-start h-[calc(100vh-8rem)]">
          <Sidebar type={type} />
        </div>
        <main className="flex-1 min-w-0">
          <div className="xl:grid xl:grid-cols-[1fr_250px] xl:gap-12">
            <div className="mx-auto w-full min-w-0">
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
                <Link to="/" className="hover:text-foreground transition-colors">
                  Docs
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link
                  to={type === 'user-guide' ? '/user-guide' : '/api-reference'}
                  className="hover:text-foreground transition-colors"
                >
                  {type === 'user-guide' ? 'User Guide' : 'API Reference'}
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium capitalize">{activeSlug?.replace(/-/g, ' ')}</span>
              </nav>

              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                  {activeSlug?.replace(/-/g, ' ')}
                </h1>
                <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 gap-2 rounded-full px-4">
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">Download</span>
                </Button>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/10">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: () => null, // Hidden because we show it above with download button
                    h2: ({ ...props }) => {
                      const id = props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-');
                      return (
                        <h2
                          id={id}
                          className="group flex items-center text-2xl font-bold mt-16 mb-6 pb-2 border-b border-border/40 scroll-mt-24"
                          {...props}
                        >
                          {props.children}
                          <a
                            href={`#${id}`}
                            className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary/60 hover:text-primary"
                          >
                            #
                          </a>
                        </h2>
                      );
                    },
                    h3: ({ children }) => (
                      <h3 className="text-lg font-bold mt-10 mb-4 text-foreground/90 tracking-tight">{children}</h3>
                    ),
                    p: ({ children }) => <p className="text-muted-foreground leading-8 mb-6 text-[15px]">{children}</p>,
                    blockquote: ({ children }) => {
                      // Extract text content to detect variant
                      const flatten = (node: any): string => {
                        if (typeof node === 'string') return node;
                        if (Array.isArray(node)) return node.map(flatten).join('');
                        if (node?.props?.children) return flatten(node.props.children);
                        return '';
                      };

                      const text = flatten(children);
                      let Icon = Info;
                      let title = 'Note';
                      let colorClass = 'border-blue-500/50 bg-blue-500/5 text-blue-700 dark:text-blue-300';

                      if (text.includes('WARNING:')) {
                        Icon = AlertTriangle;
                        title = 'Warning';
                        colorClass = 'border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-300';
                      } else if (text.includes('SUCCESS:')) {
                        Icon = CheckCircle2;
                        title = 'Success';
                        colorClass = 'border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300';
                      } else if (text.includes('TIP:')) {
                        Icon = Lightbulb;
                        title = 'Tip';
                        colorClass = 'border-purple-500/50 bg-purple-500/5 text-purple-700 dark:text-purple-300';
                      }

                      const cleanChildren = Array.isArray(children)
                        ? children.map(child => {
                            if (typeof child === 'string') {
                              return child.replace(/^(WARNING:|SUCCESS:|TIP:|INFO:)\s*/, '');
                            }
                            if (child?.props?.children && typeof child.props.children === 'string') {
                              return {
                                ...child,
                                props: {
                                  ...child.props,
                                  children: child.props.children.replace(/^(WARNING:|SUCCESS:|TIP:|INFO:)\s*/, ''),
                                },
                              };
                            }
                            return child;
                          })
                        : children;

                      return (
                        <div className={cn('my-8 rounded-xl border p-5 flex gap-4 shadow-sm', colorClass)}>
                          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 dark:bg-black/10">
                            <Icon className="h-5 w-5 shrink-0" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-[13px] uppercase tracking-[0.15em] mb-1 opacity-80">
                              {title}
                            </div>
                            <div className="text-[15px] leading-relaxed font-medium prose-p:my-0">{cleanChildren}</div>
                          </div>
                        </div>
                      );
                    },
                    code: ({ node, inline, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      return !inline && match ? (
                        <SyntaxHighlighter
                          language={language}
                          code={String(children).replace(/\n$/, '')}
                          showLineNumbers={true}
                        />
                      ) : (
                        <code
                          className={cn(
                            'bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[13px] font-medium',
                            className
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    ol: ({ children }) => <ol className="my-8 space-y-6 [counter-reset:step]">{children}</ol>,
                    li: ({ children, ordered, ...props }: any) => {
                      if (ordered) {
                        return (
                          <li className="relative pl-10 [counter-increment:step] before:content-[counter(step)] before:absolute before:left-0 before:top-1 before:flex before:items-center before:justify-center before:w-6 before:h-6 before:rounded-full before:bg-primary/10 before:text-primary before:text-[10px] before:font-bold before:border before:border-primary/20">
                            <div className="text-muted-foreground leading-7">{children}</div>
                          </li>
                        );
                      }
                      return <li className="mb-2 ml-4 list-disc text-muted-foreground">{children}</li>;
                    },
                    table: ({ children }) => (
                      <div className="my-8 w-full overflow-hidden rounded-xl border border-border/10 bg-muted/5 shadow-sm">
                        <table className="w-full text-sm text-left">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-muted/20 border-b border-border/10">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-[11px]">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-4 border-b border-border/5 text-muted-foreground">{children}</td>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>

              <div className="mt-20 pt-10 border-t border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10">
                <div className="space-y-5">
                  <h4 className="text-sm font-bold tracking-tight text-foreground/80">Was this page helpful?</h4>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-9 px-5 rounded-full hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/50 transition-all">
                      <ThumbsUp className="mr-2 h-3.5 w-3.5" /> Yes
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 px-5 rounded-full hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50 transition-all">
                      <ThumbsDown className="mr-2 h-3.5 w-3.5" /> No
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-3 text-[13px] font-medium text-muted-foreground">
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center hover:text-primary transition-colors group"
                  >
                    <Icons.gitHub className="mr-2 h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                    Edit this page on GitHub
                  </a>
                  <a
                    href="https://discord.gg/skyrmechat"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center hover:text-primary transition-colors group"
                  >
                    <MessageCircle className="mr-2 h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                    Join our Discord community
                  </a>
                </div>
              </div>
            </div>
            <div className="hidden text-sm xl:block">
              <div className="sticky top-24 h-[calc(100vh-10rem)] overflow-y-auto scrollbar-hide">
                <h4 className="font-bold text-[11px] uppercase tracking-widest text-foreground/40 mb-4 px-2">
                  On This Page
                </h4>
                <ul className="space-y-1 border-l border-border/40 ml-2">
                  {toc.map(item => (
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
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Stay Updated
                    </h5>
                    <p className="text-xs text-muted-foreground">Subscribe to our developer newsletter for updates.</p>
                    <div className="flex gap-2">
                      <Input placeholder="email@example.com" className="h-8 text-xs bg-muted/30 border-none" />
                      <Button size="xs">Join</Button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xl shadow-primary/10">
                    <h5 className="text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-90">Enterprise Support</h5>
                    <p className="text-[11px] opacity-70 leading-relaxed mb-4 font-medium">
                      Deploy Skyrme Chat on-premise with dedicated engineer support.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent border-white/20 dark:border-black/20 hover:bg-white/10 dark:hover:bg-black/10 text-white dark:text-zinc-950 text-[10px] font-bold uppercase tracking-widest transition-colors"
                    >
                      Talk to Sales
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
