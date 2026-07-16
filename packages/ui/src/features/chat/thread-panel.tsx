'use client';

import { X, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../../components/button';
import { ScrollArea } from '../../components/scroll-area';
import { MessageItem } from './message-item';
import { MessageComposer } from './message-composer';
import { MessageSkeletons } from './components/message-list';
import { useMessages, useSendMessage } from '@repo/api-client';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';
import { Skeleton } from '../../components/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { MarkdownRenderer } from '../../shared/markdown-renderer';

interface ThreadPanelProps {
  rootMessage: any;
  onClose: () => void;
  workspaceId?: string;
  channelId: string;
  channelName?: string;
}

export function ThreadPanel({
  rootMessage,
  onClose,
  workspaceId,
  channelId,
  channelName,
}: ThreadPanelProps) {
  const threadId = rootMessage.threadId || rootMessage.id;

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(channelId, workspaceId, threadId, undefined, false);

  const sendMessageMutation = useSendMessage(workspaceId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flatMap(page => page.messages);
  }, [messagesData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSendMessage = useCallback((content: string, attachments?: any[]) => {
    sendMessageMutation.mutate({
      channelId,
      content,
      threadId,
      attachments,
      messageType: 'standard',
      mentions: [],
    });
  }, [channelId, threadId, sendMessageMutation]);

  const rootUser = rootMessage.user;
  const rootTimestamp = rootMessage.timestamp
    ? format(new Date(rootMessage.timestamp), 'EEE, MMM d, h:mm a')
    : '';

  const lastReplyTime = messages.length > 0
    ? formatDistanceToNow(new Date(messages[messages.length - 1]?.timestamp || new Date()), { addSuffix: true })
    : null;

  // Collect avatar stack from unique reply authors (max 3)
  const replyAvatars = useMemo(() => {
    const seen = new Set<string>();
    const avatars: { name: string; avatar: string }[] = [];
    for (const m of messages) {
      const u = m.user;
      if (u && !seen.has(u.id)) {
        seen.add(u.id);
        avatars.push({ name: u.name || '?', avatar: u.avatar || u.image || '' });
        if (avatars.length >= 3) break;
      }
    }
    return avatars;
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-[380px] border-l border-border bg-background animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <h3 className="font-semibold text-sm leading-tight">Thread</h3>
            {channelName && (
              <p className="text-[11px] text-muted-foreground">in #{channelName}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {/* Root message card */}
          <div className="p-4 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-7 w-7 rounded-full shrink-0">
                <AvatarImage src={rootUser?.avatar || rootUser?.image} alt={rootUser?.name} />
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                  {rootUser?.name?.slice(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm text-foreground">{rootUser?.name || 'Unknown'}</span>
              <span className="text-[11px] text-muted-foreground">{rootTimestamp}</span>
            </div>
            <div className="text-[14px] leading-relaxed text-foreground pl-9">
              <MarkdownRenderer content={rootMessage.content || ''} className="whitespace-pre-wrap" />
            </div>

            {/* Reply summary */}
            {messages.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pl-9">
                <div className="flex -space-x-1.5">
                  {replyAvatars.map((a, i) => (
                    <Avatar key={i} className="h-5 w-5 rounded-full border border-background">
                      <AvatarImage src={a.avatar} alt={a.name} />
                      <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                        {a.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-[12px] font-medium text-primary">
                  {messages.length} {messages.length === 1 ? 'reply' : 'replies'}
                </span>
                {lastReplyTime && (
                  <span className="text-[11px] text-muted-foreground">Last reply {lastReplyTime}</span>
                )}
              </div>
            )}
          </div>

          {/* Replies label */}
          <div className="flex items-center gap-2 px-4 py-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {messages.length} {messages.length === 1 ? 'Reply' : 'Replies'}
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Replies */}
          {isLoading && messages.length === 0 ? (
            <div className="px-4 py-2">
              <MessageSkeletons />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No replies yet</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Be the first to reply to this thread</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map(message => (
                <MessageItem
                  key={message.id}
                  message={message}
                  channelId={channelId}
                  workspaceId={workspaceId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs h-7"
              >
                {isFetchingNextPage ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                Load older replies
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="p-3 bg-background border-t border-border shrink-0">
        <MessageComposer
          onSend={handleSendMessage}
          placeholder="Reply in thread..."
          channelId={channelId}
        />
      </div>
    </div>
  );
}
