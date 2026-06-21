'use client';

import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
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
  AblyChannels,
  AblyEvents
} from '@repo/api-client';
import { getAblyClient } from '@repo/shared';
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

  useEffect(() => {
    if (typeof window === 'undefined' || !activeChannelId) return;
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
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
    };
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
      threshold: 0.5,
    });
    return () => { observerRef.current?.disconnect(); observerRef.current = null; };
  }, [activeChannelId]);

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
