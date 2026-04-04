"use client"

import * as React from "react"
import { Bold, Italic, Link2, List, ListOrdered, Code, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  onKeyDown,
  placeholder = "Type your message...",
  className,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [activeFormats, setActiveFormats] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.textContent !== value) {
      editorRef.current.innerHTML = formatTextToHtml(value)
    }
  }, [value])

  const formatTextToHtml = (text: string): string => {
    let html = text

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>")

    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")
    html = html.replace(/_(.+?)_/g, "<em>$1</em>")

    // Code: `text`
    html = html.replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')

    // Links: [text](url)
    html = html.replace(/\[(.+?)\]$$(.+?)$$/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 underline">$1</a>')

    // Mentions: @username
    html = html.replace(
      /@([\w.]+)/g,
      '<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1 rounded">@$1</span>',
    )

    return html
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || ""
    onChange(text)
    updateActiveFormats()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case "b":
          e.preventDefault()
          applyFormat("bold")
          break
        case "i":
          e.preventDefault()
          applyFormat("italic")
          break
        case "k":
          e.preventDefault()
          applyFormat("link")
          break
      }
    }

    onKeyDown?.(e)
  }

  const updateActiveFormats = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const formats = new Set<string>()
    let node = selection.anchorNode

    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        if (element.tagName === "STRONG" || element.tagName === "B") {
          formats.add("bold")
        }
        if (element.tagName === "EM" || element.tagName === "I") {
          formats.add("italic")
        }
        if (element.tagName === "CODE") {
          formats.add("code")
        }
        if (element.tagName === "A") {
          formats.add("link")
        }
      }
      node = node.parentNode
    }

    setActiveFormats(formats)
  }

  const applyFormat = (format: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (!selectedText) return

    let formattedText = ""
    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`
        break
      case "italic":
        formattedText = `*${selectedText}*`
        break
      case "code":
        formattedText = `\`${selectedText}\``
        break
      case "link":
        const url = prompt("Enter URL:")
        if (url) {
          formattedText = `[${selectedText}](${url})`
        } else {
          return
        }
        break
    }

    if (formattedText) {
      const newText = value.substring(0, range.startOffset) + formattedText + value.substring(range.endOffset)
      onChange(newText)

      // Restore focus
      setTimeout(() => {
        editorRef.current?.focus()
      }, 0)
    }
  }

  const insertList = (ordered: boolean) => {
    const prefix = ordered ? "1. " : "- "
    const newText = value + (value ? "\n" : "") + prefix
    onChange(newText)

    setTimeout(() => {
      editorRef.current?.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      if (editorRef.current?.lastChild) {
        range.setStart(editorRef.current.lastChild, editorRef.current.lastChild.textContent?.length || 0)
        range.collapse(true)
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }, 0)
  }

  const insertQuote = () => {
    const newText = value + (value ? "\n" : "") + "> "
    onChange(newText)

    setTimeout(() => {
      editorRef.current?.focus()
    }, 0)
  }

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", activeFormats.has("bold") && "bg-muted")}
                onClick={() => applyFormat("bold")}
                type="button"
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold (Ctrl+B)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", activeFormats.has("italic") && "bg-muted")}
                onClick={() => applyFormat("italic")}
                type="button"
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italic (Ctrl+I)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", activeFormats.has("code") && "bg-muted")}
                onClick={() => applyFormat("code")}
                type="button"
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Code</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", activeFormats.has("link") && "bg-muted")}
                onClick={() => applyFormat("link")}
                type="button"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add link (Ctrl+K)</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertList(false)} type="button">
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bullet list</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertList(true)} type="button">
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Numbered list</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={insertQuote} type="button">
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Quote</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        className={cn(
          "min-h-[80px] max-h-[200px] overflow-y-auto p-3 rounded-md border border-input bg-background text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring",
          !value && "text-muted-foreground",
          className,
        )}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Formatting Guide */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Formatting: **bold** *italic* `code` [link](url) @mention</p>
      </div>
    </div>
  )
}
