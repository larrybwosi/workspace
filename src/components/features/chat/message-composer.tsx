"use client"

import { AtSign, Smile, Paperclip, Send, Bold, Italic, Code, List, ListOrdered, LinkIcon, X, File, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { uploadFile, UploadedFile } from "@/lib/utils/upload-utils";
import { mockUsers } from "@/lib/mock-data"
import { MentionSelector, MentionItem } from "@/components/shared/mention-selector"
import { EmojiPicker } from "@/components/shared/emoji-picker"
import { ChangeEvent, useEffect, useRef, useState, useMemo } from "react"
import { useChannel } from "@/hooks/api/use-channels"
import { useParams } from "next/navigation"
import { useTypingNotifier, TypingIndicator } from "./typing-indicator"
import { useCurrentUser } from "@/hooks/api/use-users"
import { LexicalEditor } from "./editor/lexical-editor"
import { $getRoot, EditorState, $getSelection, $isRangeSelection, $insertNodes, FORMAT_TEXT_COMMAND, $createTextNode, $createParagraphNode } from "lexical"
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown"
import { useWorkspace, useWorkspaceChannels, useWorkspaceMembers } from "@/hooks/api/use-workspaces"
import { $createMentionNode } from "./editor/mention-node"

interface MessageComposerProps {
  placeholder?: string
  onSend?: (message: string, attachments?: UploadedFile[]) => void
  replyingTo?: { id: string; userName: string } | null
  onCancelReply?: () => void
  channelId?: string
}

export function MessageComposer({
  placeholder = "Type a message...",
  onSend,
  replyingTo,
  onCancelReply,
  channelId,
}: MessageComposerProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const [mentionType, setMentionType] = useState<"user" | "channel" | null>(null)
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<any>(null)
  const params = useParams()
  const workspaceSlug = params.slug as string
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { data: channels } = useWorkspaceChannels(workspace?.id)
  const { data: members } = useWorkspaceMembers(workspace?.id)
  const { data: channel } = useChannel(channelId || "", workspace?.id)

  const { data: currentUser } = useCurrentUser()

  const { handleKeyPress, stopTyping } = useTypingNotifier(channelId || "", currentUser)

  const dynamicPlaceholder = useMemo(() => {
    if (replyingTo) return `Replying to @${replyingTo.userName}`
    if (channel) return `Message #${channel.name}`
    return placeholder
  }, [channel, replyingTo, placeholder])

  // Mention items preparation
  const mentionItems = useMemo((): MentionItem[] => {
    if (mentionType === "user") {
      const workspaceMembers = (members || []).map((m: any) => ({
        id: m.user.id,
        name: m.user.name,
        type: "user" as const,
        image: m.user.image || m.user.avatar,
        description: m.role || m.user.role
      }))

      let filteredMembers = workspaceMembers;
      if (channel?.isPrivate) {
        // If private channel, filter by channel members
        const channelMemberIds = new Set((channel as any).members?.map((m: any) => m.userId));
        filteredMembers = workspaceMembers.filter(m => channelMemberIds.has(m.id));
      }

      const users = filteredMembers.length > 0 ? filteredMembers : mockUsers.map(u => ({
        id: u.id,
        name: u.name,
        type: "user" as const,
        image: u.avatar,
        description: u.role
      }))

      const special: MentionItem[] = [
        { id: "all", name: "all", type: "special", description: "Notify everyone in this channel" },
        { id: "here", name: "here", type: "special", description: "Notify active members in this channel" }
      ]

      return [...special, ...users]
    }

    if (mentionType === "channel") {
      const publicChannels = (channels || []).filter((c: any) => !c.isPrivate);
      return publicChannels.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: "channel" as const,
        description: c.description || "Channel"
      }))
    }

    return []
  }, [mentionType, members, channels])

  const handleSend = () => {
    if ((message.trim() || attachments.length > 0) && !isUploading) {
      onSend?.(message, attachments)

      if (editorRef.current) {
        editorRef.current.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        });
      }

      setMessage("")
      setAttachments([])
      setMentionType(null)
      stopTyping()
    }
  }

  const handleEditorChange = (editorState: EditorState) => {
    editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        setMessage(markdown);
    })
    handleKeyPress()
  }

  const formatText = (command: any) => {
    if (editorRef.current) {
        editorRef.current.dispatchCommand(command, undefined);
    }
  }

  const insertEmoji = (emoji: string) => {
    if (editorRef.current) {
        editorRef.current.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                selection.insertText(emoji);
            } else {
                const root = $getRoot();
                root.append($createTextNode(emoji));
            }
        });
    }
  }

  const triggerMention = () => {
    if (editorRef.current) {
        editorRef.current.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                selection.insertText("@");
            }
        });
        editorRef.current.focus();
    }
  }

  // --- File Upload Logic ---

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files))
    }
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
    } finally {
      setIsUploading(false)
    }
  }

  const removeAttachment = (fileId: string) => {
    setAttachments(prev => prev.filter(f => f.id !== fileId))
  }

  const handleMentionSelect = (item: MentionItem) => {
    if (editorRef.current) {
      editorRef.current.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const anchorOffset = selection.anchor.offset;

          // Delete the partial mention query
          const text = anchorNode.getTextContent();
          const char = item.type === "channel" ? "#" : "@";
          const lastIndex = text.lastIndexOf(char, anchorOffset - 1);

          if (lastIndex !== -1) {
            selection.anchor.set(anchorNode.getKey(), lastIndex, "text");
            selection.focus.set(anchorNode.getKey(), anchorOffset, "text");
            selection.removeText();
          }

          const node = $createMentionNode(item.name);
          $insertNodes([node]);
        }
      });
    }
    setMentionType(null)
  }

  const handleMentionSearch = (search: string, type: "user" | "channel") => {
    setMentionSearch(search);
    setMentionType(search ? type : null);
  }

  const handleMentionPosition = (position: { top: number; left: number }) => {
    // Offset for the selector dropdown
    setMentionPosition({
      top: position.top - 280,
      left: position.left,
    });
  }

  return (
    <div className="bg-background rounded-lg border border-border">
      {channelId && currentUser && (
        <TypingIndicator channelId={channelId} currentUserId={currentUser.id} />
      )}

      <input 
        type="file" 
        multiple 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect}
      />

      {replyingTo && (
        <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Replying to <span className="font-medium text-foreground">{replyingTo.userName}</span>
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="p-2">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 mb-2 pb-2 border-b border-border">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => formatText(FORMAT_TEXT_COMMAND.bold)}>
                  <Bold className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => formatText(FORMAT_TEXT_COMMAND.italic)}>
                  <Italic className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => formatText(FORMAT_TEXT_COMMAND.code)}>
                  <Code className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Inline code</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex-1 rounded-lg bg-background focus-within:ring-1 focus-within:ring-ring transition-all">
          <LexicalEditor
            onChange={handleEditorChange}
            placeholder={dynamicPlaceholder}
            onEnter={handleSend}
            onMentionSearch={handleMentionSearch}
            onMentionPosition={handleMentionPosition}
            onEditorRef={(editor) => { editorRef.current = editor }}
          />
        </div>

        {mentionType && <div className="fixed inset-0 z-40" onClick={() => setMentionType(null)} />}

        {mentionType && (
            <MentionSelector
            items={mentionItems}
            onSelect={handleMentionSelect}
            searchTerm={mentionSearch}
            position={mentionPosition}
            type={mentionType}
            />
        )}

        {/* Attachment Preview Area */}
        {attachments.length > 0 && (
          <div className="mt-2 mb-2 flex flex-wrap gap-2 px-2">
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

        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-0.5">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={triggerMention}>
                    <AtSign className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mention</TooltipContent>
              </Tooltip>

              <EmojiPicker onEmojiSelect={insertEmoji}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
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
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Button
            size="sm"
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || isUploading}
            className="h-8 px-3"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
