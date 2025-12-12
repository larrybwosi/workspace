"use client"

import * as React from "react"
import { AtSign, Smile, Paperclip, Send, Bold, Italic, Code, List, ListOrdered, LinkIcon, X, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EmojiPicker } from "./emoji-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUpload } from "./file-upload"
import type { UploadedFile } from "@/lib/upload-utils"
import { UserMentionSelector } from "./user-mention-selector"
import { mockUsers } from "@/lib/mock-data"

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
  const [message, setMessage] = React.useState("")
  const [attachments, setAttachments] = React.useState<UploadedFile[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [showMentionSelector, setShowMentionSelector] = React.useState(false)
  const [mentionSearch, setMentionSearch] = React.useState("")
  const [mentionPosition, setMentionPosition] = React.useState({ top: 0, left: 0 })
  const [cursorPosition, setCursorPosition] = React.useState(0)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  React.useEffect(() => {
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
    if (message.trim() || attachments.length > 0) {
      onSend?.(message, attachments)
      setMessage("")
      setAttachments([])
      setShowMentionSelector(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !showMentionSelector) {
      e.preventDefault()
      handleSend()
    }
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }

  const insertMarkdown = (before: string, after: string = before) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = message.substring(start, end)
    const newText = message.substring(0, start) + before + selectedText + after + message.substring(end)

    setMessage(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const insertCodeBlock = () => {
    insertMarkdown("\n```javascript\n", "\n```\n")
  }

  const insertLink = () => {
    insertMarkdown("[", "](url)")
  }

  const handleUploadComplete = (files: UploadedFile[]) => {
    setAttachments((prev) => [...prev, ...files])
    setUploadDialogOpen(false)
  }

  const removeAttachment = (file: UploadedFile) => {
    setAttachments((prev) => prev.filter((f) => f.id !== file.id))
  }

  return (
    <div className="bg-background">
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

        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file) => (
              <div key={file.id} className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs">
                <File className="h-3 w-3" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => removeAttachment(file)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 border border-border rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[40px] max-h-[120px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2"
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

              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach</TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                  </DialogHeader>
                  <FileUpload onUploadComplete={handleUploadComplete} />
                </DialogContent>
              </Dialog>

              <Button
                size="icon"
                onClick={handleSend}
                disabled={!message.trim() && attachments.length === 0}
                className="h-9 w-9"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
