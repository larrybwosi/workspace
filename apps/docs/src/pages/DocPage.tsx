import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sidebar } from '@/components/sidebar';

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

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 py-10">
      <Sidebar type={type} />
      <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_250px]">
        <div className="mx-auto w-full min-w-0">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ ...props }) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return <h2 id={id} {...props} />
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
        <div className="hidden text-sm xl:block">
          <div className="sticky top-16 -mt-10 pt-4 h-[calc(100vh-4rem)] overflow-y-auto">
            <h4 className="font-medium mb-2">On This Page</h4>
            <ul className="space-y-2">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
