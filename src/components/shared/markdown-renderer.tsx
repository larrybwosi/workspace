"use client"

import * as React from "react"
import { SyntaxHighlighter } from "./syntax-highlighter"
import { useRouter, useParams } from "next/navigation"
import { useCustomEmojis } from "@/hooks/api/use-custom-emojis"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const router = useRouter()
  const params = useParams()
  const workspaceSlug = params.slug as string
  const { data: customEmojis } = useCustomEmojis(workspaceSlug)

  const escapeHtml = (text: string) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }

  const renderMarkdown = React.useCallback((text: string) => {
    // 1. Escape HTML to prevent XSS
    let html = escapeHtml(text)

    // 2. Process Code Blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || "text"
      return `<pre data-language="${language}" data-code="${encodeURIComponent(code.trim())}"></pre>`
    })

    // 3. Process Inline Code
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>',
    )

    // 4. Custom Emojis
    if (customEmojis && customEmojis.length > 0) {
      customEmojis.forEach((emoji: any) => {
        const regex = new RegExp(emoji.shortcode, 'g')
        html = html.replace(
          regex,
          `<img src="${emoji.imageUrl}" alt="${emoji.name}" title="${emoji.shortcode}" class="inline-block h-5 w-5 align-text-bottom mx-0.5" />`
        )
      })
    }

    // 5. Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')

    // 6. Italic
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em class="italic">$1</em>')

    // 7. Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del class="line-through text-muted-foreground">$1</del>')

    // 8. Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, label, url) => {
        const isSafeUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('mailto:')
        if (!isSafeUrl) return label
        return `<a href="${url}" class="text-blue-500 hover:text-blue-400 underline underline-offset-2 font-medium inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">${label}<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`
      }
    )

    // 9. User Mentions (@user, @all, @here)
    html = html.replace(
      /@([\w.]+)/g,
      (match, p1) => {
        const isSpecial = p1 === "all" || p1 === "here"
        const colorClass = isSpecial ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-primary/10 text-primary"
        return `<span class="${colorClass} px-1 rounded font-medium cursor-pointer hover:underline mention-user" data-user="${p1}">@${p1}</span>`
      }
    )

    // 10. Channel Mentions (#channel)
    html = html.replace(
      /#([\w-]+)/g,
      '<span class="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1 rounded font-medium cursor-pointer hover:underline mention-channel" data-channel="$1">#$1</span>'
    )

    // 11. Headings
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')

    // 12. Lists
    html = html.replace(/^\* (.+)$/gm, '<li class="ml-4">• $1</li>')
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

    // 13. Blockquotes
    html = html.replace(
      /^> (.+)$/gm,
      '<blockquote class="border-l-4 border-yellow-500/50 bg-yellow-500/5 pl-4 py-2 my-2 italic text-muted-foreground rounded-r">$1</blockquote>',
    )

    // 14. Horizontal rule
    html = html.replace(/^---$/gm, '<hr class="my-6 border-t border-border" />')

    return html
  }, [customEmojis])

  const processedContent = React.useMemo(() => renderMarkdown(content), [content, renderMarkdown])
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (containerRef.current) {
      // Handle syntax highlighting
      const codeBlocks = containerRef.current.querySelectorAll("pre[data-language]")
      codeBlocks.forEach((block) => {
        const language = block.getAttribute("data-language") || "text"
        const code = decodeURIComponent(block.getAttribute("data-code") || "")
        const container = document.createElement("div")
        block.parentNode?.replaceChild(container, block)

        import("react-dom/client").then(({ createRoot }) => {
          const root = createRoot(container)
          root.render(<SyntaxHighlighter code={code} language={language} />)
        })
      })

      // Handle mention clicks
      const handleMentionClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.classList.contains("mention-user")) {
          const username = target.getAttribute("data-user")
          if (username && username !== "all" && username !== "here") {
            router.push(`/profile/${username}`)
          }
        } else if (target.classList.contains("mention-channel")) {
          const channelName = target.getAttribute("data-channel")
          if (channelName) {
            // Channel navigation logic
          }
        }
      }

      containerRef.current.addEventListener("click", handleMentionClick)
      return () => {
        containerRef.current?.removeEventListener("click", handleMentionClick)
      }
    }
  }, [processedContent, router])

  return <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: processedContent }} />
}
