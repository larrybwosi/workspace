"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SyntaxHighlighter } from "../../shared/syntax-highlighter";
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
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : metadata.language || "text";
            const codeContent = String(children).replace(/\n$/, "");

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
