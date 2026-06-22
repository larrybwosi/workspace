'use client';

import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback, useState, useMemo, SetStateAction } from 'react';
import {
  useMessages,
  useSendMessage,
  useReplyToMessage,
  useAddReaction,
  useRemoveReaction,
  useMarkMessagesAsRead,
  useFriendRequests,
  useBlockUser,
  useUnblockUser,
  useSendFriendRequest,
  useRespondToFriendRequest,
  messageKeys,
} from '@repo/api-client';
import { getAblyClient, AblyChannels, AblyEvents } from '@repo/shared';
import type { Message } from '@repo/types';

export const useChannelViewParams = () => {
  const searchParamsResult = useSearchParams();
  const searchParams = Array.isArray(searchParamsResult) ? searchParamsResult[0] : searchParamsResult;
  const highlightedMessageId = searchParams.get('messageId');
  const queryClient = useQueryClient();
  return { highlightedMessageId, queryClient };
};

export const useChannelMessages = (activeChannelId: string, workspaceSlug?: string, initialThreadId?: string, contextId?: string, isWidget?: boolean) => {
  const { data: messagesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(activeChannelId, workspaceSlug, initialThreadId, contextId, isWidget);
  return { messagesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage };
};

export const useChannelMutations = (workspaceSlug?: string, isWidget?: boolean) => {
  const sendMessageMutation = useSendMessage(workspaceSlug, isWidget);
  const replyToMessageMutation = useReplyToMessage(workspaceSlug);
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();
  const markMessagesAsReadMutation = useMarkMessagesAsRead(workspaceSlug);
  return { sendMessageMutation, replyToMessageMutation, addReactionMutation, removeReactionMutation, markMessagesAsReadMutation };
};

export const useSocialActions = (dmUserId: string | null) => {
  const sendFriendRequestMutation = useSendFriendRequest();
  const respondToFriendRequestMutation = useRespondToFriendRequest();
  const { data: friendRequests } = useFriendRequests('received', 'pending');
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();
  return { sendFriendRequestMutation, respondToFriendRequestMutation, friendRequests, blockUserMutation, unblockUserMutation };
};

export const useRealtimeSubscriptions = (activeChannelId: string, workspaceSlug?: string, queryClient?: any, currentUserId?: string) => {
  useEffect(() => {
    if (!activeChannelId || !queryClient) return;
    const ably = getAblyClient();
    if (!ably) return;
    const channel = ably.channels.get(AblyChannels.channel(activeChannelId));
    const handleMessage = () => {
      const queryKey = workspaceSlug ? ['workspaces', workspaceSlug, 'channels', activeChannelId, 'messages'] : messageKeys.list(activeChannelId);
      queryClient.invalidateQueries({ queryKey });
    };
    channel.subscribe(AblyEvents.MESSAGE_SENT, handleMessage);
    channel.subscribe(AblyEvents.MESSAGE_UPDATED, handleMessage);
    channel.subscribe(AblyEvents.MESSAGE_DELETED, handleMessage);
    channel.subscribe(AblyEvents.MESSAGE_REACTION, handleMessage);
    const userChannel = ably.channels.get(AblyChannels.user(currentUserId || ''));
    userChannel.subscribe(AblyEvents.DM_RECEIVED, handleMessage);
    return () => {
      channel.unsubscribe(AblyEvents.MESSAGE_SENT, handleMessage);
      channel.unsubscribe(AblyEvents.MESSAGE_UPDATED, handleMessage);
      channel.unsubscribe(AblyEvents.MESSAGE_DELETED, handleMessage);
      channel.unsubscribe(AblyEvents.MESSAGE_REACTION, handleMessage);
      userChannel.unsubscribe(AblyEvents.DM_RECEIVED, handleMessage);
    };
  }, [activeChannelId, workspaceSlug, queryClient, currentUserId]);
};

export const useReadReceipts = (activeChannelId: string, scrollAreaRef: React.RefObject<HTMLDivElement | null>, markedMessageIds: React.MutableRefObject<Set<string>>, messages: Message[], currentUserId?: string, markMessagesAsReadMutation?: any) => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const visibleUnreadIds: string[] = [];
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const messageId = entry.target.getAttribute('data-message-id');
        if (messageId && !markedMessageIds.current.has(messageId)) {
          visibleUnreadIds.push(messageId);
          markedMessageIds.current.add(messageId);
        }
      }
    });
    if (visibleUnreadIds.length > 0) {
      markMessagesAsReadMutation.mutate({ messageIds: visibleUnreadIds, channelId: activeChannelId });
    }
  }, [activeChannelId, markedMessageIds, markMessagesAsReadMutation]);

  useEffect(() => {
    if (typeof window === 'undefined' || !activeChannelId) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
      threshold: 0.5,
    });
    return () => { observerRef.current?.disconnect(); observerRef.current = null; };
  }, [activeChannelId, handleIntersect, scrollAreaRef]);

  useEffect(() => {
    if (!observerRef.current || messages.length === 0) return;
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    const messageElements = viewport.querySelectorAll('[data-message-id]');
    messageElements.forEach(el => {
      const messageId = el.getAttribute('data-message-id');
      if (messageId && !markedMessageIds.current.has(messageId)) {
        const message = messages.find(m => m.id === messageId);
        if (message && !message.readByCurrentUser && message.userId !== currentUserId) {
          observerRef.current?.observe(el);
        }
      }
    });
  }, [messages, currentUserId]);
};

export const useChannelViewScroll = (
  messages: Message[],
  isLoading: boolean,
  highlightedMessageId: string | null,
  initialUnreadId: string | null,
  highlightedMessageRef: React.RefObject<HTMLDivElement | null>,
  firstUnreadRef: React.RefObject<HTMLDivElement | null>,
  messagesEndRef: React.RefObject<HTMLDivElement | null>
) => {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsAtBottom(entry.isIntersecting), { threshold: 0.1 });
    if (messagesEndRef.current) observer.observe(messagesEndRef.current);
    return () => observer.disconnect();
  }, [messages.length, messagesEndRef]);

  useEffect(() => {
    if (isLoading || messages.length === 0 || hasInitialScrolled) return;
    const scrollOptions: ScrollIntoViewOptions = highlightedMessageId ? { behavior: 'smooth', block: 'center' } : { behavior: 'auto', block: 'start' };
    const targetRef = highlightedMessageId ? highlightedMessageRef : (initialUnreadId ? firstUnreadRef : null);

    if (targetRef?.current) {
      setTimeout(() => { targetRef.current?.scrollIntoView(scrollOptions); setHasInitialScrolled(true); }, 100);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      setHasInitialScrolled(true);
    }
  }, [messages.length, highlightedMessageId, initialUnreadId, isLoading, hasInitialScrolled, highlightedMessageRef, firstUnreadRef, messagesEndRef]);

  useEffect(() => {
    if (hasInitialScrolled && isAtBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, hasInitialScrolled, isAtBottom, messagesEndRef]);

  return { isAtBottom, hasInitialScrolled, setHasInitialScrolled };
};

export const useUnreadLineLogic = (
  messages: Message[],
  isLoading: boolean,
  hasInitialScrolled: boolean,
  channelId: string,
  viewedChannels: Set<string>,
  isAtBottom: boolean,
  currentUserId?: string
) => {
  const [initialUnreadId, setInitialUnreadId] = useState<string | null>(null);

  const firstUnreadMessageId = useMemo(() => messages.find(m => !m.readByCurrentUser)?.id || null, [messages]);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialUnreadId && !hasInitialScrolled && !viewedChannels.has(channelId)) {
      setInitialUnreadId(firstUnreadMessageId);
      viewedChannels.add(channelId);
    }
  }, [isLoading, messages.length, firstUnreadMessageId, initialUnreadId, hasInitialScrolled, channelId, viewedChannels]);

  useEffect(() => {
    if (messages.length > 0 && hasInitialScrolled) {
      if (isAtBottom || messages[messages.length - 1].userId === currentUserId) setInitialUnreadId(null);
    }
  }, [messages, currentUserId, hasInitialScrolled, isAtBottom]);

  return { initialUnreadId, setInitialUnreadId };
};
