"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SyntaxHighlighter } from "./syntax-highlighter";
import { detectLanguage } from "../lib/language-detection";
import { useParams, useRouter } from "next/navigation";
import { useCustomEmojis } from "@repo/api-client";
import { UserMention } from "./user-mention";
import { cn } from "../lib/utils";
import { useChannels } from "@repo/api-client";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.slug as string;
  const { data: customEmojis } = useCustomEmojis(workspaceSlug);
  const { data: channels } = useChannels();

  // Custom component for mentions and emojis within text
  const renderText = (text: string) => {
    const mentionRegex = /@([\w.]+)/g;
    const emojiRegex = /:[a-z0-9_]+:/g;
    const channelRegex = /#([\w-]+)/g;

    const tokens: { index: number; length: number; element: React.ReactNode }[] = [];
    let match;

    // Find mentions
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const isSpecial = username === "all" || username === "here";
      tokens.push({
        index: match.index,
        length: match[0].length,
        element: <UserMention key={`mention-${match.index}`} username={username} isSpecial={isSpecial} />
      });
    }

    // Find channel tags
    while ((match = channelRegex.exec(text)) !== null) {
      const channelSlug = match[1];
      const channel = channels?.find((c: any) => c.slug === channelSlug || c.name.toLowerCase() === channelSlug.toLowerCase());

      tokens.push({
        index: match.index,
        length: match[0].length,
        element: (
          <span
            key={`channel-${match.index}`}
            className="text-primary hover:underline cursor-pointer font-medium"
            onClick={(e) => {
              e.preventDefault();
              if (workspaceSlug) {
                router.push(`/workspace/${workspaceSlug}/channels/${channelSlug}`);
              }
            }}
          >
            #{channel?.name || channelSlug}
          </span>
        )
      });
    }

    // Find custom emojis
    if (customEmojis && customEmojis.length > 0) {
      customEmojis.forEach((emoji: any) => {
        const regex = new RegExp(emoji.shortcode, 'g');
        while ((match = regex.exec(text)) !== null) {
          tokens.push({
            index: match.index,
            length: match[0].length,
            element: (
              <img
                key={`emoji-${match.index}-${emoji.id}`}
                src={emoji.imageUrl}
                alt={emoji.name}
                title={emoji.shortcode}
                className="inline-block h-5 w-5 align-text-bottom mx-0.5"
              />
            )
          });
        }
      });
    }

    if (tokens.length === 0) return text;

    tokens.sort((a, b) => a.index - b.index);

    const result: (string | React.ReactNode)[] = [];
    let cursor = 0;

    for (const token of tokens) {
      if (token.index < cursor) continue;
      if (token.index > cursor) {
        result.push(text.slice(cursor, token.index));
      }
      result.push(token.element);
      cursor = token.index + token.length;
    }

    if (cursor < text.length) {
      result.push(text.slice(cursor));
    }

    return result;
  };

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeContent = String(children).replace(/\n$/, "");

            if (!inline) {
              const language = match ? match[1] : detectLanguage(codeContent);
              return (
                <SyntaxHighlighter
                  code={codeContent}
                  language={language}
                  {...props}
                />
              );
            }

            return (
              <code className={cn("bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-sm font-mono text-primary", className)} {...props}>
                {children}
              </code>
            );
          },
          // Custom text renderer to handle mentions, channel tags, and emojis
          text({ children }: any) {
            return <>{renderText(String(children))}</>;
          },
          // Ensure tables and other GFM elements are styled correctly
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-border border">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="px-4 py-2 bg-muted font-bold text-left border">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 border">{children}</td>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="my-0">{children}</li>;
          },
          blockquote({ children }) {
            return <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2 text-muted-foreground">{children}</blockquote>;
          },
          a({ href, children }) {
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
