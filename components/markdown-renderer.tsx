"use client"

import * as React from "react"
import { SyntaxHighlighter } from "./syntax-highlighter"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    let html = text

    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || "text"
      return `<pre data-language="${language}" data-code="${encodeURIComponent(code.trim())}"></pre>`
    })

    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>',
    )

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')

    // Italic
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em class="italic">$1</em>')

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del class="line-through text-muted-foreground">$1</del>')

    html = html.replace(
      /\[([^\]]+)\]$$([^)]+)$$/g,
      '<a href="$2" class="text-blue-500 hover:text-blue-400 underline underline-offset-2 font-medium inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">$1<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>',
    )

    // Mentions
    html = html.replace(
      /@([\w.]+)/g,
      '<span class="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1 rounded font-medium">@$1</span>',
    )

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')

    // Lists
    html = html.replace(/^\* (.+)$/gm, '<li class="ml-4">• $1</li>')
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

    // Task list support
    html = html.replace(
      /^- \[ \] (.+)$/gm,
      '<li class="ml-4 flex items-center gap-2"><input type="checkbox" class="rounded" disabled /> $1</li>',
    )
    html = html.replace(
      /^- \[x\] (.+)$/gm,
      '<li class="ml-4 flex items-center gap-2 line-through text-muted-foreground"><input type="checkbox" class="rounded" checked disabled /> $1</li>',
    )

    // Blockquotes
    html = html.replace(
      /^> (.+)$/gm,
      '<blockquote class="border-l-4 border-yellow-500/50 bg-yellow-500/5 pl-4 py-2 my-2 italic text-muted-foreground rounded-r">$1</blockquote>',
    )

    // Horizontal rule support
    html = html.replace(/^---$/gm, '<hr class="my-6 border-t border-border" />')

    return html
  }

  const processedContent = renderMarkdown(content)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (containerRef.current) {
      const codeBlocks = containerRef.current.querySelectorAll("pre[data-language]")
      codeBlocks.forEach((block) => {
        const language = block.getAttribute("data-language") || "text"
        const code = decodeURIComponent(block.getAttribute("data-code") || "")
        const container = document.createElement("div")
        block.parentNode?.replaceChild(container, block)

        // Render SyntaxHighlighter component
        import("react-dom/client").then(({ createRoot }) => {
          const root = createRoot(container)
          root.render(<SyntaxHighlighter code={code} language={language} />)
        })
      })
    }
  }, [processedContent])

  return <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: processedContent }} />
}
