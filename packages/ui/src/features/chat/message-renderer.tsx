'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SyntaxHighlighter } from '../../shared/syntax-highlighter';
import { cn } from '../../lib/utils';

interface MessageRendererProps {
  content: string;
  metadata?: Record<string, any>;
  className?: string;
}

/**
 * Universal Message Renderer that handles Markdown and Code blocks.
 * This is used for both standard messages and text within custom messages.
 */
export function MessageRenderer({ content, metadata = {}, className }: MessageRendererProps) {
  if (!content) return null;

  return (
    <div className={cn('prose prose-neutral dark:prose-invert max-w-none w-full break-words text-[14px] leading-[1.45]', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-[1.45] text-[14px] mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-2 ml-5 list-disc [&>li]:mt-1 text-[14px] leading-[1.45]">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-5 list-decimal [&>li]:mt-1 text-[14px] leading-[1.45]">{children}</ol>,
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : metadata.language || 'text';
            const codeContent = String(children).replace(/\n$/, '');

            if (!inline) {
              return <SyntaxHighlighter code={codeContent} language={language} fileName={metadata.fileName} />;
            }

            return (
              <code
                className="bg-muted/70 dark:bg-muted/40 border border-border/50 px-1.5 py-0.5 rounded-md text-[13px] font-mono text-foreground font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
