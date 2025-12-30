"use client"
import { SyntaxHighlighter } from "@/components/shared/syntax-highlighter"
import type { Message, MessageMetadata } from "@/lib/types"

interface CodeMessageProps {
  message: Message
  metadata: MessageMetadata
}

export function CodeMessage({ message, metadata }: CodeMessageProps) {
  // Extract code blocks from content
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const matches = [...message.content.matchAll(codeBlockRegex)]

  if (matches.length === 0) {
    return null
  }

  return (
    <div className="mt-2 space-y-3">
      {matches.map((match, index) => {
        const language = match[1] || metadata.language || "text"
        const code = match[2].trim()

        return <SyntaxHighlighter key={index} code={code} language={language} fileName={metadata.fileName} />
      })}
    </div>
  )
}
