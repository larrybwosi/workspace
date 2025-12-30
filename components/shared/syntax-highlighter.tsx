"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SyntaxHighlighterProps {
  code: string
  language: string
  fileName?: string
  className?: string
}

export function SyntaxHighlighter({ code, language, fileName, className }: SyntaxHighlighterProps) {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple syntax highlighting for common languages
  const highlightCode = (code: string, lang: string) => {
    const keywords: Record<string, string[]> = {
      javascript: [
        "const",
        "let",
        "var",
        "function",
        "return",
        "if",
        "else",
        "for",
        "while",
        "class",
        "import",
        "export",
        "from",
        "async",
        "await",
      ],
      typescript: [
        "const",
        "let",
        "var",
        "function",
        "return",
        "if",
        "else",
        "for",
        "while",
        "class",
        "import",
        "export",
        "from",
        "async",
        "await",
        "interface",
        "type",
        "enum",
      ],
      python: [
        "def",
        "class",
        "import",
        "from",
        "return",
        "if",
        "else",
        "elif",
        "for",
        "while",
        "try",
        "except",
        "with",
        "as",
      ],
      jsx: [
        "const",
        "let",
        "var",
        "function",
        "return",
        "if",
        "else",
        "for",
        "while",
        "class",
        "import",
        "export",
        "from",
        "async",
        "await",
      ],
      tsx: [
        "const",
        "let",
        "var",
        "function",
        "return",
        "if",
        "else",
        "for",
        "while",
        "class",
        "import",
        "export",
        "from",
        "async",
        "await",
        "interface",
        "type",
      ],
    }

    let highlighted = code
    const langKeywords = keywords[lang.toLowerCase()] || []

    // Highlight strings
    highlighted = highlighted.replace(
      /(["'`])(?:(?=(\\?))\2.)*?\1/g,
      '<span class="text-green-600 dark:text-green-400">$&</span>',
    )

    // Highlight comments
    highlighted = highlighted.replace(/\/\/.*/g, '<span class="text-gray-500 dark:text-gray-400 italic">$&</span>')
    highlighted = highlighted.replace(
      /\/\*[\s\S]*?\*\//g,
      '<span class="text-gray-500 dark:text-gray-400 italic">$&</span>',
    )

    // Highlight keywords
    langKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g")
      highlighted = highlighted.replace(
        regex,
        `<span class="text-purple-600 dark:text-purple-400 font-semibold">${keyword}</span>`,
      )
    })

    // Highlight numbers
    highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="text-orange-600 dark:text-orange-400">$&</span>')

    // Highlight functions
    highlighted = highlighted.replace(
      /\b([a-zA-Z_]\w*)\s*(?=\()/g,
      '<span class="text-blue-600 dark:text-blue-400">$1</span>',
    )

    return highlighted
  }

  return (
    <div className={cn("rounded-lg border border-border bg-muted/50 overflow-hidden", className)}>
      {fileName && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted">
          <span className="text-xs font-mono text-muted-foreground">{fileName}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase">{language}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}
      <div className="relative">
        {!fileName && (
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 z-10" onClick={copyToClipboard}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        )}
        <pre className="p-4 overflow-x-auto text-sm">
          <code className="font-mono" dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
        </pre>
      </div>
    </div>
  )
}
