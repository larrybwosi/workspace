import { useEffect, useState, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sidebar } from '@/components/sidebar';
import { SyntaxHighlighter, Button, Input, cn } from '@repo/ui';
import { ChevronRight, MessageCircle, ThumbsUp, ThumbsDown, Info, AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react';

const CodeBlock = ({ children, language }: { children: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children.replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="my-8 rounded-xl overflow-hidden shadow-md border border-border/10 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-medium text-white/40 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter code={children.replace(/\n$/, '')} language={language} />
    </div>
  );
};

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

  return (
    <div className="container flex-1">
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

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-4xl font-bold tracking-tight mb-4 border-none">{children}</h1>
                ),
                h2: ({ ...props }) => {
                  const id = props.children
                    ?.toString()
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-');
                  return (
                    <h2 id={id} className="group flex items-center text-2xl font-semibold mt-12 mb-4 scroll-mt-24" {...props}>
                      {props.children}
                      <a
                        href={`#${id}`}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                      >
                        #
                      </a>
                    </h2>
                  );
                },
                h3: ({ children }) => (
                  <h3 className="text-xl font-medium mt-8 mb-4">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground leading-7 mb-6">{children}</p>
                ),
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
                  }

                  return (
                    <div className={cn('my-6 rounded-lg border-l-4 p-4 flex gap-4', colorClass)}>
                      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-sm uppercase tracking-wider mb-1">{title}</div>
                        <div className="text-[15px] leading-relaxed opacity-90 prose-p:my-0">{children}</div>
                      </div>
                    </div>
                  );
                },
                code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  return !inline && match ? (
                    <CodeBlock language={language}>{String(children)}</CodeBlock>
                  ) : (
                    <code className={cn('bg-muted/80 text-primary px-1.5 py-0.5 rounded font-mono text-[13px]', className)} {...props}>
                      {children}
                    </code>
                  );
                },
                ol: ({ children }) => (
                  <ol className="my-8 space-y-6 [counter-reset:step]">{children}</ol>
                ),
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
                  <th className="px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-[11px]">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-4 border-b border-border/5 text-muted-foreground">{children}</td>
                ),
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
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center hover:text-foreground transition-colors"
              >
                Edit this page on GitHub
              </a>
              <a
                href="https://discord.gg/skyrmechat"
                target="_blank"
                rel="noreferrer"
                className="flex items-center hover:text-foreground transition-colors"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Join our Discord community
              </a>
            </div>
          </div>
            </div>
            <div className="hidden text-sm xl:block">
              <div className="sticky top-24 h-[calc(100vh-10rem)] overflow-y-auto scrollbar-hide">
                <h4 className="font-bold text-[11px] uppercase tracking-widest text-foreground/40 mb-4 px-2">On This Page</h4>
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
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Stay Updated</h5>
                <p className="text-xs text-muted-foreground">Subscribe to our developer newsletter for updates.</p>
                <div className="flex gap-2">
                  <Input placeholder="email@example.com" className="h-8 text-xs bg-muted/30 border-none" />
                  <Button size="xs">Join</Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h5 className="text-xs font-bold text-primary mb-1">Need help?</h5>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Our engineers are available to help you integrate Skyrme Chat.
                </p>
                <Button variant="link" size="xs" className="p-0 h-auto text-primary font-bold">
                  Contact Support &rarr;
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
