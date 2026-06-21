'use client';

import { X, Loader2 } from 'lucide-react';
import { Button } from '../../components/button';
import { ScrollArea } from '../../components/scroll-area';
import { MessageItem } from './message-item';
import { MessageComposer } from './message-composer';
import { useMessages, useSendMessage } from '@repo/api-client';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { type Message } from '../../lib/types';
import { Skeleton } from '../../components/skeleton';

interface ThreadPanelProps {
  rootMessage: any;
  onClose: () => void;
  workspaceId?: string;
  channelId: string;
}

export function ThreadPanel({
  rootMessage,
  onClose,
  workspaceId,
  channelId,
}: ThreadPanelProps) {
  // Use threadId from rootMessage or fallback to contextId/rootMessageId logic
  const threadId = rootMessage.threadId || rootMessage.id;

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(channelId, workspaceId, threadId);

  const sendMessageMutation = useSendMessage(workspaceId);

  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flatMap(page => page.messages);
  }, [messagesData]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = (content: string, attachments?: any[]) => {
    sendMessageMutation.mutate({
      channelId,
      content,
      threadId,
      attachments,
      messageType: 'standard',
    });
  };

  return (
    <div className="flex flex-col h-full w-[400px] border-l border-border bg-background shadow-xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-background/50 backdrop-blur-md shrink-0">
        <div className="flex flex-col">
          <h3 className="font-bold text-sm">Thread</h3>
          <p className="text-[11px] text-muted-foreground truncate w-[280px]">
            {rootMessage.user?.name}'s message
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col py-4">
          {/* Root Message */}
          <div className="pb-4 border-b border-border/50">
            <MessageItem
              message={rootMessage}
              showAvatar={true}
              channelId={channelId}
              workspaceId={workspaceId}
            />
          </div>

          <div className="px-4 py-2 flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {messages.length} {messages.length === 1 ? 'Reply' : 'Replies'}
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Replies */}
          {isLoading ? (
            <div className="space-y-4 px-4 py-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
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
                {isFetchingNextPage ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="p-4 bg-background border-t border-border shrink-0">
        <MessageComposer
          onSend={handleSendMessage}
          placeholder="Reply in thread..."
          channelId={channelId}
        />
      </div>
    </div>
  );
}
