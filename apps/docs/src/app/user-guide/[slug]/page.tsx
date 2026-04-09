import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fs from 'fs';
import path from 'path';
import { Sidebar } from '@/components/sidebar';

interface DocPageProps {
  params: Promise<{ slug: string }>;
}

async function getDocContent(slug: string, type: 'user-guide' | 'api-reference') {
  const contentPath = path.join(process.cwd(), 'src/content', type === 'user-guide' ? 'docs' : 'api', `${slug}.md`);

  if (!fs.existsSync(contentPath)) {
    return null;
  }

  return fs.readFileSync(contentPath, 'utf8');
}

function extractToC(content: string) {
  const headings = content.match(/^##\s+.+$/gm) || [];
  return headings.map(h => {
    const title = h.replace(/^##\s+/, '');
    const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return { title, id };
  });
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')} - Documentation`,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const content = await getDocContent(slug, 'user-guide');

  if (!content) {
    notFound();
  }

  const toc = extractToC(content);

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 py-10">
      <Sidebar type="user-guide" />
      <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_250px]">
        <div className="mx-auto w-full min-w-0">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ node, ...props }) => {
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
