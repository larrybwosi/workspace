"use client"

import { AtSign, Smile, Paperclip, Send, Bold, Italic, Code, List, ListOrdered, LinkIcon, X, File, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { uploadFile, UploadedFile } from "@/lib/upload-utils";
import { mockUsers } from "@/lib/mock-data"
import { UserMentionSelector } from "@/components/shared/user-mention-selector"
import { EmojiPicker } from "@/components/shared/emoji-picker"
import { ChangeEvent, useEffect, useRef, useState, ClipboardEvent } from "react"

interface MessageComposerProps {
  placeholder?: string
  onSend?: (message: string, attachments?: UploadedFile[]) => void
  replyingTo?: { id: string; userName: string } | null
  onCancelReply?: () => void
}

export function MessageComposer({
  placeholder = "Type a message...",
  onSend,
  replyingTo,
  onCancelReply,
}: MessageComposerProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const [showMentionSelector, setShowMentionSelector] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  // Mention logic
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const beforeCursor = message.slice(0, cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.slice(lastAtIndex + 1)
      if (!afterAt.includes(" ") && afterAt.length <= 20) {
        setMentionSearch(afterAt)
        setShowMentionSelector(true)

        const rect = textarea.getBoundingClientRect()
        setMentionPosition({
          top: rect.top - 280,
          left: rect.left,
        })
      } else {
        setShowMentionSelector(false)
      }
    } else {
      setShowMentionSelector(false)
    }
  }, [message, cursorPosition])

  const handleSend = () => {
    if ((message.trim() || attachments.length > 0) && !isUploading) {
      onSend?.(message, attachments)
      setMessage("")
      setAttachments([])
      setShowMentionSelector(false)
      // Reset height
      if (textareaRef.current) textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !showMentionSelector) {
      e.preventDefault()
      handleSend()
    }
  }

  // --- File Upload Logic ---

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files))
    }
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const processFiles = async (files: File[]) => {
    setIsUploading(true)
    try {
      const uploadPromises = files.map(file => uploadFile(file))
      const uploadedFiles = await Promise.all(uploadPromises)
      setAttachments(prev => [...prev, ...uploadedFiles])
    } catch (error) {
      console.error("Upload failed", error)
      // toast.error("Failed to upload files") 
    } finally {
      setIsUploading(false)
    }
  }

  const removeAttachment = (fileId: string) => {
    setAttachments(prev => prev.filter(f => f.id !== fileId))
  }

  // --- Paste Handling (Files & Code) ---

  const detectCodeBlock = (text: string) => {
    const lines = text.split('\n');
    const hasIndentation = lines.some(line => line.startsWith('  ') || line.startsWith('\t'));
    const hasCodeSymbols = /[{};=()[\]<>]/.test(text);
    const hasKeywords = /\b(const|let|var|function|class|import|export|if|for|return|interface|type)\b/.test(text);
    
    // Heuristic: If it has multiple lines AND (code symbols OR keywords), treat as code
    return lines.length > 1 && (hasCodeSymbols || hasKeywords || hasIndentation);
  }

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    // 1. Handle File Paste (e.g. Screenshots)
    if (e.clipboardData.files.length > 0) {
      e.preventDefault()
      await processFiles(Array.from(e.clipboardData.files))
      return
    }

    // 2. Handle Code/Markdown Detection
    const text = e.clipboardData.getData("text")
    if (text) {
      // If already markdown formatted (simple check), let it pass naturally
      if (text.trim().startsWith("```")) return;

      if (detectCodeBlock(text)) {
        e.preventDefault()
        insertMarkdown("\n```\n", "\n```\n", text)
      }
    }
  }

  // --- Markdown Insertion Helper ---

  const insertMarkdown = (before: string, after: string = before, customContent?: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    // If we have custom content (from paste), use that, otherwise use selection
    const contentToWrap = customContent !== undefined 
      ? customContent 
      : message.substring(start, end)

    const newText = message.substring(0, start) + before + contentToWrap + after + message.substring(end)

    setMessage(newText)

    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + contentToWrap.length + (customContent ? after.length : 0)
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      setCursorPosition(newCursorPos)
    }, 0)
  }

  const insertCodeBlock = () => {
    insertMarkdown("\n```javascript\n", "\n```\n")
  }

  const insertLink = () => {
    insertMarkdown("[", "](url)")
  }

  const handleMentionSelect = (user: any) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const beforeCursor = message.slice(0, cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf("@")
    const beforeMention = message.slice(0, lastAtIndex)
    const afterCursor = message.slice(cursorPosition)

    const newMessage = `${beforeMention}@${user.name} ${afterCursor}`
    setMessage(newMessage)
    setShowMentionSelector(false)

    setTimeout(() => {
      const newPosition = lastAtIndex + user.name.length + 2
      textarea.focus()
      textarea.setSelectionRange(newPosition, newPosition)
      setCursorPosition(newPosition)
    }, 0)
  }

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }

  return (
    <div className="bg-background rounded-lg">
      <input 
        type="file" 
        multiple 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect}
      />

      {showMentionSelector && <div className="fixed inset-0 z-40" onClick={() => setShowMentionSelector(false)} />}

      {showMentionSelector && (
        <UserMentionSelector
          users={mockUsers}
          onSelect={handleMentionSelect}
          searchTerm={mentionSearch}
          position={mentionPosition}
        />
      )}

      {replyingTo && (
        <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Replying to <span className="font-medium text-foreground">{replyingTo.userName}</span>
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="p-3">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 mb-2 pb-2 border-b border-border">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown("**", "**")}>
                  <Bold className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown("*", "*")}>
                  <Italic className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown("`", "`")}>
                  <Code className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Inline code</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={insertCodeBlock}>
                  <Code className="h-3.5 w-3.5" />
                  <span className="text-[8px] ml-0.5">{}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Code block</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown("\n- ", "")}>
                  <List className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bullet list</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown("\n1. ", "")}>
                  <ListOrdered className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Numbered list</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={insertLink}>
                  <LinkIcon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert link</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Attachment Preview Area */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file) => (
              <div key={file.id} className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs animate-in fade-in zoom-in-95 duration-200">
                <File className="h-3 w-3 text-primary" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-muted-foreground">({Math.round(parseInt(file.size || '0') / 1024)}KB)</span>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-background/50" onClick={() => removeAttachment(file.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 border border-border rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring transition-all">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="min-h-[40px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 bg-transparent"
              rows={1}
            />
          </div>

          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMessage(message + "@")}>
                    <AtSign className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mention</TooltipContent>
              </Tooltip>

              <EmojiPicker onEmojiSelect={(emoji) => setMessage(message + emoji)}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Emoji</TooltipContent>
                </Tooltip>
              </EmojiPicker>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>

              <Button
                size="icon"
                onClick={handleSend}
                disabled={(!message.trim() && attachments.length === 0) || isUploading}
                className="h-9 w-9"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}