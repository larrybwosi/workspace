'use client';

import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../../../components/scroll-area';
import { Button } from '../../../components/button';
import { Skeleton } from '../../../components/skeleton';
import { MessageItem } from '../message-item';
import { cn } from '../../../lib/utils';
import type { Message } from '@repo/types';

export const MessageSkeleton = memo(function MessageSkeleton() {
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
});

MessageSkeleton.displayName = 'MessageSkeleton';

const DateDivider = memo(function DateDivider({ date }: { date: Date }) {
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
});

const UnreadDivider = memo(function UnreadDivider() {
  return (
    <div className="flex items-center my-1 mx-4">
      <div className="flex-1 h-px bg-red-500/60" />
      <span className="px-2 text-[10px] font-bold text-red-500 uppercase tracking-wider whitespace-nowrap">
        New Messages
      </span>
      <div className="flex-1 h-px bg-red-500/60" />
    </div>
  );
});

const LoadMoreButton = memo(({ hasNextPage, fetchNextPage, isFetchingNextPage }: {
  hasNextPage?: boolean,
  fetchNextPage: () => void,
  isFetchingNextPage: boolean
}) => {
  if (!hasNextPage) return null;
  return (
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
  );
});

LoadMoreButton.displayName = 'LoadMoreButton';

export const MessageSkeletons = memo(() => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map(i => (
      <MessageSkeleton key={i} />
    ))}
  </div>
));

MessageSkeletons.displayName = 'MessageSkeletons';

const EmptyState = memo(({ activeChannelId, channelName }: { activeChannelId: string; channelName?: string }) => {
  const name = channelName || activeChannelId;
  const isDM = activeChannelId.startsWith('dm-');

  return (
    <div className="flex flex-col items-start justify-end flex-1 p-8 mb-4">
      <div className="h-16 w-16 bg-muted rounded-full mb-4 flex items-center justify-center text-3xl font-bold text-muted-foreground">
        {isDM ? ' @ ' : ' # '}
      </div>
      <h1 className="text-3xl font-bold mb-2">
        Welcome to {isDM ? '' : '#'}
        {name}!
      </h1>
      <p className="text-muted-foreground">
        This is the start of the {isDM ? 'direct message history with ' : ' #'}
        <span className="font-semibold">{name}</span>
        {isDM ? '.' : ' channel.'}
      </p>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

const MessageItemWrapper = memo(({
  item,
  isGrouped,
  isHighlighted,
  isReply,
  handleReply,
  handleOpenThread,
  handleReaction,
  channelId,
  workspaceSlug
}: {
  item: any,
  isGrouped: boolean,
  isHighlighted: boolean,
  isReply: boolean,
  handleReply: (id: string) => void,
  handleOpenThread: (msg: any) => void,
  handleReaction: (id: string, emoji: string, isCustom?: boolean, customEmojiId?: string) => void,
  channelId: string,
  workspaceSlug?: string
}) => {
  const message = item.data;

  if (isReply) {
    return (
      <div className="flex">
        <div className="w-[52px] shrink-0 flex justify-center">
          <div className="w-px bg-border/60 h-full" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <MessageItem
            message={message}
            showAvatar={!isGrouped}
            onReply={handleReply}
            onThreadOpen={handleOpenThread}
            onReaction={handleReaction}
            depth={item.depth}
            isReply={true}
            isHighlighted={isHighlighted}
            channelId={channelId}
            workspaceId={workspaceSlug}
          />
        </div>
      </div>
    );
  }

  return (
    <MessageItem
      message={message}
      showAvatar={!isGrouped}
      onReply={handleReply}
      onThreadOpen={handleOpenThread}
      onReaction={handleReaction}
      depth={item.depth}
      isReply={false}
      isHighlighted={isHighlighted}
      channelId={channelId}
      workspaceId={workspaceSlug}
    />
  );
});

MessageItemWrapper.displayName = 'MessageItemWrapper';

const MessageItems = memo(({
  renderList,
  highlightedMessageId,
  initialUnreadId,
  highlightedMessageRef,
  firstUnreadRef,
  handleReply,
  handleOpenThread,
  handleReaction,
  channelId,
  workspaceSlug
}: {
  renderList: any[],
  highlightedMessageId: string | null,
  initialUnreadId: string | null,
  highlightedMessageRef: React.MutableRefObject<HTMLDivElement | null>,
  firstUnreadRef: React.MutableRefObject<HTMLDivElement | null>,
  handleReply: (id: string) => void,
  handleOpenThread: (msg: any) => void,
  handleReaction: (id: string, emoji: string, isCustom?: boolean, customEmojiId?: string) => void,
  channelId: string,
  workspaceSlug?: string
}) => (
  <>
    {renderList.map((item, index) => {
      if (item.type === 'date') {
        return <DateDivider key={`date-${item.date.getTime()}`} date={item.date} />;
      }

      if (item.type === 'unread') {
        return <UnreadDivider key="unread-divider" />;
      }

      const message = item.data;
      const prevItem = renderList[index - 1];

      let isGrouped = false;
      if (prevItem?.type === 'message') {
        const prevMessage = prevItem.data;
        const timeDiff = new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime();
        const isSameUser = prevMessage.userId === message.userId;
        const isRecent = timeDiff < 7 * 60 * 1000;
        const isSameDepth = prevItem.depth === item.depth;
        isGrouped = isSameUser && isRecent && isSameDepth;
      }

      const isHighlighted = message.id === highlightedMessageId;
      const isInitialUnread = message.id === initialUnreadId;
      const isReply = item.depth > 0;

      return (
        <div
          key={message.id}
          ref={el => {
            if (isHighlighted) highlightedMessageRef.current = el;
            if (isInitialUnread) firstUnreadRef.current = el;
          }}
          data-message-id={message.id}
          className={cn(
            'group relative w-full',
            isGrouped ? 'mt-0.5' : 'mt-3',
            isHighlighted && 'bg-yellow-500/10',
            'hover:bg-muted/40 transition-colors duration-75'
          )}
        >
          <MessageItemWrapper
            item={item}
            isGrouped={isGrouped}
            isHighlighted={isHighlighted}
            isReply={isReply}
            handleReply={handleReply}
            handleOpenThread={handleOpenThread}
            handleReaction={handleReaction}
            channelId={channelId}
            workspaceSlug={workspaceSlug}
          />
        </div>
      );
    })}
  </>
));

MessageItems.displayName = 'MessageItems';

export const MessageList = memo(({
  scrollAreaRef,
  messagesEndRef,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isLoading,
  renderList,
  highlightedMessageId,
  initialUnreadId,
  highlightedMessageRef,
  firstUnreadRef,
  handleReply,
  handleOpenThread,
  handleReaction,
  channelId,
  workspaceSlug,
  activeChannelId,
  channelName
}: {
  scrollAreaRef: React.RefObject<HTMLDivElement | null>,
  messagesEndRef: React.RefObject<HTMLDivElement | null>,
  hasNextPage?: boolean,
  fetchNextPage: () => void,
  isFetchingNextPage: boolean,
  isLoading: boolean,
  renderList: any[],
  highlightedMessageId: string | null,
  initialUnreadId: string | null,
  highlightedMessageRef: React.MutableRefObject<HTMLDivElement | null>,
  firstUnreadRef: React.MutableRefObject<HTMLDivElement | null>,
  handleReply: (id: string) => void,
  handleOpenThread: (msg: any) => void,
  handleReaction: (id: string, emoji: string, isCustom?: boolean, customEmojiId?: string) => void,
  channelId: string,
  workspaceSlug?: string,
  activeChannelId: string,
  channelName?: string
}) => (
  <div className="flex-1 min-h-0 w-full relative bg-dotted">
    <ScrollArea ref={scrollAreaRef} className="h-full w-full">
      <div className="flex flex-col justify-end min-h-full pt-4 pb-2">
        {hasNextPage && (
          <LoadMoreButton
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        )}

        {isLoading ? (
          <MessageSkeletons />
        ) : (
          <div className="flex flex-col w-full">
            {!hasNextPage && <EmptyState activeChannelId={activeChannelId} channelName={channelName} />}
            <MessageItems
              renderList={renderList}
              highlightedMessageId={highlightedMessageId}
              initialUnreadId={initialUnreadId}
              highlightedMessageRef={highlightedMessageRef}
              firstUnreadRef={firstUnreadRef}
              handleReply={handleReply}
              handleOpenThread={handleOpenThread}
              handleReaction={handleReaction}
              channelId={channelId}
              workspaceSlug={workspaceSlug}
            />
          </div>
        )}

        <div ref={messagesEndRef} className="h-px" />
      </div>
    </ScrollArea>
  </div>
));

MessageList.displayName = 'MessageList';
