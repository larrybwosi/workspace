"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SyntaxHighlighter } from "@/components/shared/syntax-highlighter";
import type { Message, MessageMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CodeMessageProps {
  message: Message;
  metadata: MessageMetadata;
  className?: string;
}

export function CodeMessage({
  message,
  metadata,
  className,
}: CodeMessageProps) {
  // If no content, return nothing
  if (!message.content) return null;

  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none w-full",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Override standard elements for enterprise styling
          p: ({ children }) => (
            <p className="leading-7 mb-4 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
          ),

          // Handle Code Blocks vs Inline Code
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : metadata.language || "text";
            const codeContent = String(children).replace(/\n$/, "");

            if (!inline) {
              // Render the full SyntaxHighlighter component for code blocks
              return (
                <SyntaxHighlighter
                  code={codeContent}
                  language={language}
                  fileName={metadata.fileName}
                />
              );
            }

            // Render simple badge for inline code (e.g. `const x = 1`)
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
        {message.content}
      </ReactMarkdown>
    </div>
  );
}
