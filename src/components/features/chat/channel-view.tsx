'use client';

import { useSearchParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './message-item';
import { MessageComposer } from './message-composer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { Thread, Message, Attachment } from '@/lib/types';
import { mockThread, mockUsers } from '@/lib/mock-data';
import {
  useMessages,
  useSendMessage,
  useReplyToMessage,
  useMarkMessagesAsRead,
  messageKeys,
} from '@/hooks/api/use-messages';
import { useAddReaction, useRemoveReaction } from '@/hooks/api/use-reactions';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAblyClient, AblyChannels, AblyEvents } from '@/lib/integrations/ably';
import { UploadedFile } from '@/lib/utils/upload-utils';
import { toast } from 'sonner';
import { useChannel } from '@/hooks/api/use-channels';
import { useSession } from '@/lib/auth/auth-client';

interface ChannelViewProps {
  channelId: string;
  workspaceId?: string;
  threadId?: string;
  contextId?: string;
  isWidget?: boolean;
}

// --- Helper Components ---

function MessageSkeleton() {
  return (
    <div className="flex items-start gap-3 py-0.5 px-4 w-full">
      <Skeleton className="h-10 w-10 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5 overflow-hidden">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3.5 w-[85%]" />
        <Skeleton className="h-3.5 w-[55%]" />
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: Date }) {
  const isToday = new Date().toDateString() === date.toDateString();
  const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();

  let dateLabel = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  if (isToday) dateLabel = 'Today';
  if (isYesterday) dateLabel = 'Yesterday';

  return (
    <div className="flex items-center my-3 mx-4">
      <div className="flex-1 h-px bg-border" />
      <span className="px-2 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{dateLabel}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function UnreadDivider() {
  return (
    <div className="flex items-center my-1 mx-4">
      <div className="flex-1 h-px bg-red-500/60" />
      <span className="px-2 text-[10px] font-bold text-red-500 uppercase tracking-wider whitespace-nowrap">
        New Messages
      </span>
      <div className="flex-1 h-px bg-red-500/60" />
    </div>
  );
}

// --- Main Component ---

export function ChannelView({
  channelId,
  workspaceId,
  threadId: initialThreadId,
  contextId,
  isWidget,
}: ChannelViewProps) {
  const searchParams = useSearchParams();
  const highlightedMessageId = searchParams.get('messageId');
  const queryClient = useQueryClient();

  const activeChannelId = channelId;

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(activeChannelId, workspaceId, initialThreadId, contextId, isWidget);

  const { data: channelData } = useChannel(activeChannelId, workspaceId);

  // Real-time subscriptions
  useEffect(() => {
    if (!activeChannelId) return;

    const ably = getAblyClient();
    if (!ably) return;

    const channel = ably.channels.get(AblyChannels.channel(activeChannelId));

    const handleMessage = (message: any) => {
      const queryKey = workspaceId
        ? ['workspaces', workspaceId, 'channels', activeChannelId, 'messages']
        : messageKeys.list(activeChannelId);

      queryClient.invalidateQueries({ queryKey });
    };

    channel.subscribe(AblyEvents.MESSAGE_SENT, handleMessage);
    channel.subscribe(AblyEvents.MESSAGE_UPDATED, handleMessage);
    channel.subscribe(AblyEvents.MESSAGE_DELETED, handleMessage);
    channel.subscribe(AblyEvents.MESSAGE_REACTION, handleMessage);

    return () => {
      channel.unsubscribe(AblyEvents.MESSAGE_SENT, handleMessage);
      channel.unsubscribe(AblyEvents.MESSAGE_UPDATED, handleMessage);
      channel.unsubscribe(AblyEvents.MESSAGE_DELETED, handleMessage);
      channel.unsubscribe(AblyEvents.MESSAGE_REACTION, handleMessage);
    };
  }, [activeChannelId, workspaceId, queryClient]);

  // API Mutations
  const sendMessageMutation = useSendMessage(workspaceId, isWidget);
  const replyToMessageMutation = useReplyToMessage(workspaceId);
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();
  const markMessagesAsReadMutation = useMarkMessagesAsRead(workspaceId);

  // State & Refs
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    userName: string;
  } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const highlightedMessageRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const markedMessageIds = useRef<Set<string>>(new Set());

  const { data: session } = useSession();
  const currentUser = session?.user;

  // 1. Flatten Data
  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flatMap(page => page.messages);
  }, [messagesData]);

  const firstUnreadMessageId = useMemo(() => {
    const firstUnread = messages.find(m => !m.readByCurrentUser);
    return firstUnread?.id || null;
  }, [messages]);

  // Intersection Observer for scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }

    return () => observer.disconnect();
  }, [messages.length]);

  // Reset marked messages when channel changes
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  useEffect(() => {
    markedMessageIds.current.clear();
    setHasInitialScrolled(false);
  }, [activeChannelId]);

  // 2. Scroll Handling
  useEffect(() => {
    if (isLoading || messages.length === 0 || hasInitialScrolled) return;

    if (highlightedMessageId && highlightedMessageRef.current) {
      setTimeout(() => {
        highlightedMessageRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        setHasInitialScrolled(true);
      }, 100);
    } else if (firstUnreadMessageId && firstUnreadRef.current) {
      setTimeout(() => {
        firstUnreadRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        });
        setHasInitialScrolled(true);
      }, 100);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      setHasInitialScrolled(true);
    }
  }, [messages.length, highlightedMessageId, firstUnreadMessageId, isLoading, hasInitialScrolled]);

  // Auto-scroll to bottom on new messages if already at bottom
  useEffect(() => {
    if (hasInitialScrolled && isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // 3. Read Receipts (Batch) - Trigger when at bottom
  useEffect(() => {
    if (messages.length > 0 && isAtBottom) {
      const unreadMessageIds = messages
        .filter(m => !m.readByCurrentUser && !markedMessageIds.current.has(m.id))
        .map(m => m.id);

      if (unreadMessageIds.length > 0) {
        unreadMessageIds.forEach(id => markedMessageIds.current.add(id));

        markMessagesAsReadMutation.mutate({
          messageIds: unreadMessageIds,
          channelId: activeChannelId,
        });
      }
    }
  }, [messages, activeChannelId, isAtBottom]);

  // 4. Organize Messages
  const renderList = useMemo(() => {
    const list: Array<
      { type: 'message'; data: Message; depth: number } | { type: 'date'; date: Date } | { type: 'unread' }
    > = [];

    const messageMap = new Map<string, Message & { replies: Message[] }>();
    messages.forEach(msg => messageMap.set(msg.id, { ...msg, replies: [] }));

    const rootMessages: (Message & { replies: Message[] })[] = [];
    messages.forEach(msg => {
      if (msg.replyTo && messageMap.has(msg.replyTo)) {
        messageMap.get(msg.replyTo)!.replies.push(messageMap.get(msg.id)!);
      } else if (!msg.replyTo) {
        rootMessages.push(messageMap.get(msg.id)!);
      }
    });

    rootMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let lastDate: Date | null = null;

    rootMessages.forEach(rootMsg => {
      const currentDate = new Date(rootMsg.timestamp);
      if (!lastDate || currentDate.toDateString() !== lastDate.toDateString()) {
        list.push({ type: 'date', date: currentDate });
        lastDate = currentDate;
      }

      if (rootMsg.id === firstUnreadMessageId) list.push({ type: 'unread' });

      list.push({ type: 'message', data: rootMsg, depth: 0 });

      rootMsg.replies.forEach(reply => {
        const replyDate = new Date(reply.timestamp);
        if (!lastDate || replyDate.toDateString() !== lastDate.toDateString()) {
          list.push({ type: 'date', date: replyDate });
          lastDate = replyDate;
        }

        if (reply.id === firstUnreadMessageId) list.push({ type: 'unread' });
        list.push({ type: 'message', data: reply, depth: 1 });
      });
    });

    return list;
  }, [messages, firstUnreadMessageId]);

  // Handlers
  const handleSendMessage = (content: string, attachments?: UploadedFile[]) => {
    if (!activeChannelId) {
      console.error('No active channel ID to send message to');
      return;
    }

    const payload = {
      channelId: activeChannelId,
      content,
      mentions: [],
      messageType: 'standard' as const,
      attachments,
      threadId: initialThreadId,
      contextId,
    };

    if (replyingTo) {
      replyToMessageMutation.mutate(
        { ...payload, messageId: replyingTo.id, attachments },
        {
          onSuccess: () => {
            setReplyingTo(null);
          },
          onError: error => {
            console.error('Failed to send reply:', error);
            toast.error('Failed to send reply. Please try again.');
          },
        }
      );
    } else {
      sendMessageMutation.mutate(payload, {
        onError: error => {
          console.error('Failed to send message:', error);
          toast.error('Failed to send message. Please try again.');
        },
      });
    }
  };

  const handleReply = (messageId: string) => {
    const replyMessage = messages.find(m => m.id === messageId);
    if (replyMessage) {
      const user = (replyMessage as any).user;
      setReplyingTo({ id: messageId, userName: user?.name || 'Unknown' });
    }
  };

  const handleReaction = (messageId: string, emoji: string, isCustom?: boolean, customEmojiId?: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const hasReacted = message.reactions.find(r => r.emoji === emoji)?.users.includes(currentUser?.id || '');

    if (hasReacted) {
      removeReactionMutation.mutate({
        messageId,
        emoji,
        channelId: activeChannelId,
      });
    } else {
      addReactionMutation.mutate({
        messageId,
        emoji,
        channelId: activeChannelId,
        isCustom,
        customEmojiId,
      });
    }
  };

  return (
    <div className={cn('flex flex-col h-dvh w-full bg-background overflow-hidden relative', isWidget && 'border-none')}>
      {/* Header */}
      {!isWidget && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b shrink-0 bg-background/95 backdrop-blur z-10 sticky top-0">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <div className="flex items-baseline gap-1.5 min-w-0">
            <h2 className="font-semibold text-sm leading-none truncate">
              # {channelData?.name || activeChannelId || 'general'}
            </h2>
            <span className="text-xs text-muted-foreground truncate hidden sm:block">{messages.length} messages</span>
          </div>
        </div>
      )}

      {/* Main Scroll Area */}
      <div className="flex-1 min-h-0 w-full relative">
        <ScrollArea ref={scrollAreaRef} className="h-full w-full">
          {/* Top padding, then messages push to bottom */}
          <div className="flex flex-col justify-end min-h-full pt-4 pb-2">
            {/* Load More */}
            {hasNextPage && (
              <div className="flex justify-center py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-xs text-muted-foreground h-7"
                >
                  {isFetchingNextPage ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : 'Load older messages'}
                </Button>
              </div>
            )}

            {/* Content */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <MessageSkeleton key={i} />
                ))}
              </div>
            ) : renderList.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center opacity-50">
                <div className="h-14 w-14 bg-muted rounded-full mb-3 flex items-center justify-center text-2xl">👋</div>
                <h3 className="font-semibold text-sm">No messages yet</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Be the first to send a message in #{activeChannelId}.
                </p>
              </div>
            ) : (
              <div className="flex flex-col w-full">
                {renderList.map((item, index) => {
                  if (item.type === 'date') {
                    return <DateDivider key={`date-${item.date.getTime()}`} date={item.date} />;
                  }

                  if (item.type === 'unread') {
                    return <UnreadDivider key="unread-divider" />;
                  }

                  const message = item.data;
                  const prevItem = renderList[index - 1];

                  // Group consecutive messages from same user within 7 min
                  let isGrouped = false;
                  if (prevItem?.type === 'message') {
                    const prevMessage = prevItem.data;
                    const timeDiff = new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime();
                    const isSameUser = prevMessage.userId === message.userId;
                    const isRecent = timeDiff < 7 * 60 * 1000;
                    // Don't group across depth changes (root vs reply)
                    const isSameDepth = prevItem.depth === item.depth;
                    isGrouped = isSameUser && isRecent && isSameDepth;
                  }

                  const isHighlighted = message.id === highlightedMessageId;
                  const isFirstUnread = message.id === firstUnreadMessageId;
                  const isReply = item.depth > 0;

                  return (
                    <div
                      key={message.id}
                      ref={isHighlighted ? highlightedMessageRef : isFirstUnread ? firstUnreadRef : undefined}
                      className={cn(
                        'group relative w-full',
                        // Discord-style: compact gap for grouped, small gap for new block
                        isGrouped ? 'mt-0.5' : 'mt-3',
                        isHighlighted && 'bg-yellow-500/10',
                        // Hover highlight like Discord
                        'hover:bg-muted/40 transition-colors duration-75'
                      )}
                    >
                      {/* Reply indentation: left border + indent matching avatar column */}
                      {isReply ? (
                        // 40px avatar + 12px gap = 52px total left offset to align reply content
                        <div className="flex">
                          {/* Left gutter: matches avatar width (40px) + gap (12px) = 52px */}
                          <div className="w-[52px] shrink-0 flex justify-center">
                            <div className="w-px bg-border/60 h-full" />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <MessageItem
                              message={message}
                              showAvatar={!isGrouped}
                              onReply={handleReply}
                              onReaction={handleReaction}
                              depth={item.depth}
                              isReply={true}
                              isHighlighted={isHighlighted}
                              channelId={channelId}
                            />
                          </div>
                        </div>
                      ) : (
                        <MessageItem
                          message={message}
                          showAvatar={!isGrouped}
                          onReply={handleReply}
                          onReaction={handleReaction}
                          depth={item.depth}
                          isReply={false}
                          isHighlighted={isHighlighted}
                          channelId={channelId}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div ref={messagesEndRef} className="h-px" />
          </div>
        </ScrollArea>
      </div>

      {/* Composer */}
      <div className="shrink-0 px-4 py-3 border-t bg-background">
        <MessageComposer
          onSend={handleSendMessage}
          placeholder={replyingTo ? `Replying to @${replyingTo.userName}` : `Message #${activeChannelId || 'thread'}`}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          channelId={activeChannelId}
        />
      </div>
    </div>
  );
}
