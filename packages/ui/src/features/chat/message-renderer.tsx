"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SyntaxHighlighter } from "../../shared/syntax-highlighter";
import { detectLanguage } from "../../lib/language-detection";
import { cn } from "../../lib/utils";

interface MessageRendererProps {
  content: string;
  metadata?: Record<string, any>;
  className?: string;
}

/**
 * Universal Message Renderer that handles Markdown and Code blocks.
 * This is used for both standard messages and text within custom messages.
 */
export function MessageRenderer({
  content,
  metadata = {},
  className,
}: MessageRendererProps) {
  if (!content) return null;

  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none w-full break-words",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="leading-7 mb-4 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
          ),
          table: ({ children }) => (
            <div className="my-6 w-full overflow-y-auto">
              <table className="w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 font-bold">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border p-2 text-left">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-border p-2">{children}</td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>
          ),
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeContent = String(children).replace(/\n$/, "");
            const language = match ? match[1] : (metadata.language || detectLanguage(codeContent));

            if (!inline) {
              return (
                <SyntaxHighlighter
                  code={codeContent}
                  language={language}
                  fileName={metadata.fileName}
                />
              );
            }

            return (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground font-semibold"
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
