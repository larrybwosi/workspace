"use client";

import * as React from "react";
import { SyntaxHighlighter } from "./syntax-highlighter";
import { useParams } from "next/navigation";
import { useCustomEmojis } from "@/hooks/api/use-custom-emojis";
import { UserMention } from "./user-mention";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const { data: customEmojis } = useCustomEmojis(workspaceSlug);

  const parts = React.useMemo(() => {
    // This is a simplified parser that handles mentions and custom emojis
    // while leaving other markdown features to be handled as HTML strings.
    // In a full implementation, we'd use a real markdown parser like remark.

    let currentContent = content;
    const result: (string | React.ReactNode)[] = [];

    // Simple regex for mentions: @username, @all, @here
    const mentionRegex = /@([\w.]+)/g;

    // Custom emojis regex: :shortcode:
    const emojiRegex = /:[a-z0-9_]+:/g;

    let lastIndex = 0;
    let match;

    // Combine regexes for a single pass if possible, or sequential
    // For now, let's do a more robust approach by splitting and identifying

    const tokens: { index: number; length: number; element: React.ReactNode }[] = [];

    // Find mentions
    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1];
      const isSpecial = username === "all" || username === "here";
      tokens.push({
        index: match.index,
        length: match[0].length,
        element: <UserMention key={`mention-${match.index}`} username={username} isSpecial={isSpecial} />
      });
    }

    // Find custom emojis
    if (customEmojis && customEmojis.length > 0) {
      customEmojis.forEach((emoji: any) => {
        const regex = new RegExp(emoji.shortcode, 'g');
        while ((match = regex.exec(content)) !== null) {
          tokens.push({
            index: match.index,
            length: match[0].length,
            element: (
              <img
                key={`emoji-${match.index}`}
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

    // Sort tokens by index
    tokens.sort((a, b) => a.index - b.index);

    // Build parts array
    let cursor = 0;
    for (const token of tokens) {
      if (token.index < cursor) continue; // Skip overlaps

      if (token.index > cursor) {
        result.push(content.slice(cursor, token.index));
      }

      result.push(token.element);
      cursor = token.index + token.length;
    }

    if (cursor < content.length) {
      result.push(content.slice(cursor));
    }

    return result;
  }, [content, customEmojis]);

  // We still need to handle the rest of the markdown (bold, italic, etc.)
  // For simplicity while maintaining the requirement of clickable mentions,
  // we can wrap the text parts in a simplified markdown-to-JSX component or
  // just handle basic formatting here.

  const renderPart = (part: string | React.ReactNode, index: number) => {
    if (typeof part !== 'string') return part;

    // Basic formatting for the string parts
    // This is still a bit "dirty" but avoids the createRoot hydration mess.
    let html = part
      .replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
      }[m] || m))
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em class="italic">$1</em>')
      .replace(/~~(.+?)~~/g, '<del class="line-through text-muted-foreground">$1</del>')
      .replace(/`([^`]+)`/g, '<code class="bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>');

    return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className={className}>
      {parts.map((part, i) => renderPart(part, i))}
    </div>
  );
}
