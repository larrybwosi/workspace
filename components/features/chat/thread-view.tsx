"use client";

import { useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageItem } from "./message-item";
import { MessageComposer } from "./message-composer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import type { Thread, Message, Attachment } from "@/lib/types";
import { mockThread, mockUsers } from "@/lib/mock-data";
import {
  useMessages,
  useSendMessage,
  useReplyToMessage,
  useMarkMessageAsRead,
} from "@/hooks/api/use-messages";
import { useAddReaction, useRemoveReaction } from "@/hooks/api/use-reactions";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { UploadedFile } from "@/lib/upload-utils";

interface ThreadViewProps {
  thread?: Thread;
  channelId?: string;
}

// --- Helper Components ---

function MessageSkeleton() {
  return (
    // responsive padding: px-2 on mobile, px-4 on desktop
    <div className="flex items-start gap-3 py-2 px-2 md:px-4 w-full">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 md:w-24" />
          <Skeleton className="h-3 w-8 md:w-12" />
        </div>
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: Date }) {
  const isToday = new Date().toDateString() === date.toDateString();
  const isYesterday =
    new Date(Date.now() - 86400000).toDateString() === date.toDateString();

  let dateLabel = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (isToday) dateLabel = "Today";
  if (isYesterday) dateLabel = "Yesterday";

  return (
    <div className="flex items-center my-4 px-2 md:px-4">
      <div className="flex-1 h-[1px] bg-border" />
      <span className="px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
        {dateLabel}
      </span>
      <div className="flex-1 h-[1px] bg-border" />
    </div>
  );
}

function UnreadDivider() {
  return (
    <div className="flex items-center my-2 px-0 w-full group">
      <div className="flex-1 h-[1px] bg-red-500/50 group-hover:bg-red-500 transition-colors" />
      <span className="px-2 text-[10px] md:text-xs font-bold text-red-500 uppercase tracking-wider">
        New Messages
      </span>
      <div className="flex-1 h-[1px] bg-red-500/50 group-hover:bg-red-500 transition-colors" />
    </div>
  );
}

// --- Main Component ---

export function ThreadView({
  thread = mockThread,
  channelId,
}: ThreadViewProps) {
  const searchParams = useSearchParams();
  const highlightedMessageId = searchParams.get("messageId");

  const activeChannelId = channelId || thread.channelId;

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(activeChannelId);

  // API Mutations
  const sendMessageMutation = useSendMessage();
  const replyToMessageMutation = useReplyToMessage();
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();
  const markAsReadMutation = useMarkMessageAsRead();

  // State & Refs
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    userName: string;
  } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const highlightedMessageRef = useRef<HTMLDivElement>(null);

  // 1. Flatten Data
  const messages = useMemo(() => {
    if (!messagesData?.pages) return thread.messages;
    return messagesData.pages.flatMap((page) => page.messages);
  }, [messagesData, thread.messages]);

  // 2. Scroll Handling
  useEffect(() => {
    if (highlightedMessageId && highlightedMessageRef.current) {
      setTimeout(() => {
        highlightedMessageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } else if (!isLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length, highlightedMessageId, isLoading]);

  // 3. Read Receipts
  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessages = messages.filter((m) => !m.readByCurrentUser);
      if (unreadMessages.length > 0) {
        unreadMessages.forEach((msg) => {
          markAsReadMutation.mutate({
            messageId: msg.id,
            channelId: activeChannelId,
          });
        });
      }
    }
  }, [messages, activeChannelId]);

  const firstUnreadMessageId = useMemo(() => {
    const firstUnread = messages.find((m) => !m.readByCurrentUser);
    return firstUnread?.id || null;
  }, [messages]);

  // 4. Organize Messages
  const renderList = useMemo(() => {
    const list: Array<
      | { type: "message"; data: Message; depth: number }
      | { type: "date"; date: Date }
      | { type: "unread" }
    > = [];

    const messageMap = new Map<string, Message & { replies: Message[] }>();
    messages.forEach((msg) => messageMap.set(msg.id, { ...msg, replies: [] }));

    const rootMessages: (Message & { replies: Message[] })[] = [];
    messages.forEach((msg) => {
      if (msg.replyTo && messageMap.has(msg.replyTo)) {
        messageMap.get(msg.replyTo)!.replies.push(messageMap.get(msg.id)!);
      } else if (!msg.replyTo) {
        rootMessages.push(messageMap.get(msg.id)!);
      }
    });

    rootMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let lastDate: Date | null = null;

    rootMessages.forEach((rootMsg) => {
      const currentDate = new Date(rootMsg.timestamp);
      if (!lastDate || currentDate.toDateString() !== lastDate.toDateString()) {
        list.push({ type: "date", date: currentDate });
        lastDate = currentDate;
      }

      if (rootMsg.id === firstUnreadMessageId) list.push({ type: "unread" });

      list.push({ type: "message", data: rootMsg, depth: 0 });

      rootMsg.replies.forEach((reply) => {
        const replyDate = new Date(reply.timestamp);
        if (!lastDate || replyDate.toDateString() !== lastDate.toDateString()) {
          list.push({ type: "date", date: replyDate });
          lastDate = replyDate;
        }

        if (reply.id === firstUnreadMessageId) list.push({ type: "unread" });
        list.push({ type: "message", data: reply, depth: 1 });
      });
    });

    return list;
  }, [messages, firstUnreadMessageId]);

  // Handlers
  const handleSendMessage = (content: string, attachments?: UploadedFile[]) => {
    const payload = {
      channelId: activeChannelId,
      content,
      mentions: [],
      messageType: "standard" as const,
      attachments,
    };

    if (replyingTo) {
      replyToMessageMutation.mutate({ ...payload, messageId: replyingTo.id, attachments });
    } else {
      sendMessageMutation.mutate(payload);
    }
    setReplyingTo(null);
  };

  const handleReply = (messageId: string) => {
    const replyMessage = messages.find((m) => m.id === messageId);
    if (replyMessage) {
      const user = mockUsers.find((u) => u.id === replyMessage.userId);
      setReplyingTo({ id: messageId, userName: user?.name || "Unknown" });
      // Focus input logic would go here
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;
    const currentUserId = mockUsers[0].id;
    const hasReacted = message.reactions
      .find((r) => r.emoji === emoji)
      ?.users.includes(currentUserId);

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
      });
    }
  };

  return (
    // Responsive: Use h-[100dvh] to fix mobile browser bar scroll issues
    <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shadow-sm shrink-0 bg-background/95 backdrop-blur z-10 sticky top-0">
        <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
        <div className="flex flex-col min-w-0">
          <h2 className="font-bold text-base leading-none truncate">
            {thread.title}
          </h2>
          <span className="text-xs text-muted-foreground mt-1 truncate">
            {activeChannelId ? `#${activeChannelId}` : "General"} •{" "}
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Main Scroll Area */}
      <div className="flex-1 min-h-0 w-full relative">
        <ScrollArea ref={scrollAreaRef} className="h-full w-full">
          <div className="flex flex-col justify-end min-h-full py-4">
            {/* Load More Trigger */}
            {hasNextPage && (
              <div className="flex justify-center py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-xs text-muted-foreground"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : (
                    "Load older messages"
                  )}
                </Button>
              </div>
            )}

            {/* Content Render */}
            {isLoading ? (
              <div className="space-y-4 px-0 md:px-2">
                {[1, 2, 3, 4].map((i) => (
                  <MessageSkeleton key={i} />
                ))}
              </div>
            ) : renderList.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center opacity-60">
                <div className="h-16 w-16 bg-muted rounded-full mb-4 flex items-center justify-center text-2xl">
                  👋
                </div>
                <h3 className="font-semibold text-lg">No messages yet</h3>
                <p className="text-sm px-4">
                  Be the first to start the conversation in #{activeChannelId}.
                </p>
              </div>
            ) : (
              <div className="flex flex-col w-full">
                {renderList.map((item, index) => {
                  if (item.type === "date") {
                    return (
                      <DateDivider
                        key={`date-${item.date.getTime()}`}
                        date={item.date}
                      />
                    );
                  }

                  if (item.type === "unread") {
                    return <UnreadDivider key="unread-divider" />;
                  }

                  const message = item.data;
                  const prevItem = renderList[index - 1];

                  let isGrouped = false;
                  if (prevItem?.type === "message") {
                    const prevMessage = prevItem.data;
                    const timeDiff =
                      new Date(message.timestamp).getTime() -
                      new Date(prevMessage.timestamp).getTime();
                    const isSameUser = prevMessage.userId === message.userId;
                    const isRecent = timeDiff < 7 * 60 * 1000;
                    isGrouped = isSameUser && isRecent;
                  }

                  const isHighlighted = message.id === highlightedMessageId;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "group relative w-full pr-2 md:pr-4 transition-colors duration-200",
                        "hover:bg-muted/30",
                        // On mobile, touch active state often replaces hover
                        "active:bg-muted/30",
                        isGrouped ? "mt-[2px] py-0.5" : "mt-[17px] py-0.5",
                        isHighlighted &&
                          "bg-yellow-500/10 hover:bg-yellow-500/20 active:bg-yellow-500/20"
                      )}
                      ref={isHighlighted ? highlightedMessageRef : undefined}
                    >
                      <div
                        className={cn(
                          "pl-2 md:pl-4 w-full",
                          item.depth > 0 &&
                            "pl-4 md:pl-12 border-l-2 border-muted ml-2 md:ml-4"
                        )}
                      >
                        <MessageItem
                          message={message}
                          showAvatar={!isGrouped}
                          onReply={handleReply}
                          onReaction={handleReaction}
                          depth={item.depth}
                          isReply={item.depth > 0}
                          isHighlighted={isHighlighted}
                          channelId={channelId}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} className="h-px" />
          </div>
        </ScrollArea>
      </div>

      {/* Composer Area */}
      {/* Added pb-safe or extra bottom padding can help on mobile if not handled by global layout */}
      <div className="shrink-0 p-2 md:p-4 border-t bg-background">
        <MessageComposer
          onSend={handleSendMessage}
          placeholder={
            replyingTo
              ? `Replying to @${replyingTo.userName}`
              : `Message #${activeChannelId || "thread"}`
          }
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  );
}
