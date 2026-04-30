'use client';

import { AtSign, Smile, Paperclip, Send, Bold, Italic, Code, X, File, Loader2 } from 'lucide-react';
import { Button } from '../../components/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';
import { uploadFile, type UploadedFile } from '@repo/shared';
import { MentionSelector, MentionItem } from '../../shared/mention-selector';
import { EmojiPicker } from '../../shared/emoji-picker';
import React, { ChangeEvent, useEffect, useRef, useState, useMemo } from 'react';
import { useChannel } from '@repo/api-client';
import { useParams } from 'next/navigation';
import { useTypingNotifier, TypingIndicator } from './typing-indicator';
import { useCurrentUser } from '@repo/api-client';
import { useWorkspace, useWorkspaceChannels, useWorkspaceMembers } from '@repo/api-client';
import TextareaAutosize from 'react-textarea-autosize';
import { cn } from '../../lib/utils';
import { haptic } from '../../lib/haptics';

interface MessageComposerProps {
  placeholder?: string;
  onSend?: (message: string, attachments?: UploadedFile[]) => void;
  replyingTo?: { id: string; userName: string } | null;
  onCancelReply?: () => void;
  channelId?: string;
}

export function MessageComposer({
  placeholder = 'Type a message...',
  onSend,
  replyingTo,
  onCancelReply,
  channelId,
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [mentionType, setMentionType] = useState<'user' | 'channel' | null>(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const { data: workspace } = useWorkspace(workspaceSlug);
  const { data: channels } = useWorkspaceChannels(workspace?.id);
  const { data: membersData } = useWorkspaceMembers(workspace?.id);
  const { data: channel } = useChannel(channelId || '', workspace?.id);

  const { data: currentUser } = useCurrentUser();

  const { handleKeyPress, stopTyping } = useTypingNotifier(channelId || '', currentUser);

  const dynamicPlaceholder = useMemo(() => {
    if (replyingTo) return `Replying to @${replyingTo.userName}`;
    if (channel) return `Message #${channel.name}`;
    return placeholder;
  }, [channel, replyingTo, placeholder]);

  // Mention items preparation
  const mentionItems = useMemo((): MentionItem[] => {
    if (mentionType === 'user') {
      const workspaceMembers = (membersData.members || []).map((m: any) => ({
        id: m.user.id,
        name: m.user.name,
        type: 'user' as const,
        image: m.user.image || m.user.avatar,
        description: m.role || m.user.role,
      }));

      let filteredMembers = workspaceMembers;
      const isDM = channelId?.startsWith('dm-');

      if (isDM) {
        // In DMs, only suggest the other user (and self)
        const dmUserId = channelId?.replace('dm-', '');
        filteredMembers = workspaceMembers.filter((m: any) => m.id === dmUserId || m.id === currentUser?.id);
      } else if ((channel as any)?.type === 'private') {
        const channelMemberIds = new Set((channel as any).members?.map((m: any) => m.userId));
        filteredMembers = workspaceMembers.filter((m: any) => channelMemberIds.has(m.id));
      }

      const special: MentionItem[] = isDM
        ? []
        : [
            { id: 'all', name: 'all', type: 'special', description: 'Notify everyone in this channel' },
            { id: 'here', name: 'here', type: 'special', description: 'Notify active members in this channel' },
          ];

      return [...special, ...filteredMembers];
    }

    if (mentionType === 'channel') {
      const publicChannels = (channels || []).filter((c: any) => c.type !== 'private');
      return publicChannels.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: 'channel' as const,
        description: c.description || 'Channel',
      }));
    }

    return [];
  }, [mentionType, membersData, channels, channel]);

  const handleSend = () => {
    if ((message.trim() || attachments.length > 0) && !isUploading) {
      // Correcting construction to avoid API errors
      const cleanedAttachments = attachments.map(att => ({
        name: att.name,
        type: att.type,
        url: att.url,
        size: att.size,
      }));

      onSend?.(message, cleanedAttachments as any);
      haptic.light();
      setMessage('');
      setAttachments([]);
      setMentionType(null);
      stopTyping();
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionType) {
      // Handle mention selection with keyboard is handled by MentionSelector
      // but we need to prevent Enter from sending message if selector is open
      if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Tab') {
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    handleKeyPress();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setMessage(val);
    setCursorPosition(pos || 0);

    // Detect @ or # trigger
    const textBeforeCursor = val.slice(0, pos || 0);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const lastHash = textBeforeCursor.lastIndexOf('#');

    const lastTriggerPos = Math.max(lastAt, lastHash);

    if (lastTriggerPos !== -1 && (lastTriggerPos === 0 || /\s/.test(textBeforeCursor[lastTriggerPos - 1]))) {
      const type = textBeforeCursor[lastTriggerPos] === '@' ? 'user' : 'channel';
      const search = textBeforeCursor.slice(lastTriggerPos + 1);

      if (!/\s/.test(search)) {
        setMentionType(type);
        setMentionSearch(search);

        // Calculate position for the selector (simplified)
        const rect = e.target.getBoundingClientRect();
        setMentionPosition({
          top: rect.top - 200, // Show above
          left: rect.left + 20,
        });
        return;
      }
    }
    setMentionType(null);
  };

  const insertTextAtCursor = (text: string, prefixToRemove = '') => {
    const start = textareaRef.current?.selectionStart || 0;
    const end = textareaRef.current?.selectionEnd || 0;

    let newStart = start;
    let newMessage = message;

    if (prefixToRemove) {
      const textBeforeCursor = message.slice(0, start);
      const lastIndex = textBeforeCursor.lastIndexOf(prefixToRemove);
      if (lastIndex !== -1) {
        newMessage = message.slice(0, lastIndex) + text + message.slice(end);
        newStart = lastIndex + text.length;
      }
    } else {
      newMessage = message.slice(0, start) + text + message.slice(end);
      newStart = start + text.length;
    }

    setMessage(newMessage);

    // Set focus and cursor back after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newStart);
      }
    }, 0);
  };

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const start = textareaRef.current?.selectionStart || 0;
    const end = textareaRef.current?.selectionEnd || 0;
    const selection = message.slice(start, end);

    const newText = `${prefix}${selection}${suffix}`;
    const newMessage = message.slice(0, start) + newText + message.slice(end);

    setMessage(newMessage);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + prefix.length + selection.length + suffix.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    insertTextAtCursor(emoji);
  };

  const triggerMention = () => {
    insertTextAtCursor('@');
    textareaRef.current?.focus();
  };

  const handleMentionSelect = (item: MentionItem) => {
    const prefix = mentionType === 'user' ? '@' : '#';
    insertTextAtCursor(`${prefix}${item.name} `, `${prefix}${mentionSearch}`);
    setMentionType(null);
  };

  // --- File Upload Logic ---

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => uploadFile(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (fileId: string) => {
    setAttachments(prev => prev.filter(f => f.id !== fileId));
  };

  // --- Visual Decorations (Simple Highlight) ---
  const renderDecoratedMessage = () => {
    if (!message) return null;

    const parts = message.split(/(@\w+|#\w+)/g);
    return (
      <div className="absolute inset-0 px-3 py-2 text-sm pointer-events-none whitespace-pre-wrap break-words text-transparent border-none">
        {parts.map((part, i) => {
          if (part.startsWith('@') || part.startsWith('#')) {
            return (
              <span key={i} className="text-blue-400 bg-blue-400/10 rounded-sm">
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
        {/* Match the trailing newline behavior of textarea */}
        {message.endsWith('\n') && <br />}
      </div>
    );
  };

  return (
    <div className="relative group/composer">
      {channelId && currentUser && <TypingIndicator channelId={channelId} currentUserId={currentUser.id} />}

      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm focus-within:shadow-md focus-within:border-primary/30 transition-all duration-300">
        {replyingTo && (
          <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex items-center justify-between rounded-t-2xl">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              Replying to <span className="font-bold text-foreground">@{replyingTo.userName}</span>
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-muted" onClick={onCancelReply}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="p-1">
          <div className="relative flex-1 bg-transparent min-h-[44px]">
            {renderDecoratedMessage()}
            <TextareaAutosize
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={dynamicPlaceholder}
              className="w-full bg-transparent border-none focus:ring-0 resize-none px-4 py-3 text-sm min-h-[44px] relative z-10 placeholder:text-muted-foreground/50"
              maxRows={15}
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
            <div className="mt-2 mb-2 flex flex-wrap gap-2 px-3 pb-2">
              {attachments.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border/50 rounded-xl text-xs animate-in fade-in zoom-in-95 duration-200"
                >
                  <File className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[150px] truncate font-medium">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-background rounded-full"
                    onClick={() => removeAttachment(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between p-2 pt-1 border-t border-border/30">
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={300}>
                <div className="flex items-center bg-muted/30 rounded-xl px-1">
                  <EmojiPicker onEmojiSelect={insertEmoji}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-lg">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </EmojiPicker>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-lg"
                    onClick={triggerMention}
                  >
                    <AtSign className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="w-px h-4 bg-border/50 mx-1" />

                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-lg" onClick={() => wrapSelection('**')}>
                    <Bold className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-lg" onClick={() => wrapSelection('_')}>
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-lg" onClick={() => wrapSelection('`')}>
                    <Code className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMessage('');
                  setAttachments([]);
                }}
                className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={(!message.trim() && attachments.length === 0) || isUploading}
                className="h-9 px-4 rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 transition-all active:scale-95"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
