'use client';

import { useSearchParams } from 'next/navigation';
import { MessageComposer } from './message-composer';
import { ThreadPanel } from './thread-panel';
import { cn } from '../../lib/utils';
import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { type UploadedFile } from '@repo/shared';
import { toast } from 'sonner';
import { useChannel, useUser, useUserSocialProfile, userKeys } from '@repo/api-client';
import { useSession } from '@repo/shared';
import { EditChannelDialog } from '../workspace/edit-channel-dialog';
import type { Message } from '@repo/types';

import {
  useChannelViewParams,
  useChannelMessages,
  useChannelMutations,
  useSocialActions,
  useRealtimeSubscriptions,
  useReadReceipts,
  useChannelViewScroll,
  useUnreadLineLogic
} from './hooks/use-channel-view';

import { SocialBanner } from './components/social-banner';
import { ChannelHeader } from './components/channel-header';
import { MessageList } from './components/message-list';

interface ChannelViewProps {
  channelId: string;
  workspaceId?: string;
  threadId?: string;
  contextId?: string;
  isWidget?: boolean;
  onToggleInfo?: () => void;
  onToggleSidebar?: () => void;
}

export function ChannelView({
  channelId,
  workspaceId: workspaceSlug,
  threadId: initialThreadId,
  contextId,
  isWidget,
  onToggleInfo,
  onToggleSidebar,
}: ChannelViewProps) {
  const { highlightedMessageId, queryClient } = useChannelViewParams();
  const { messagesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChannelMessages(channelId, workspaceSlug, initialThreadId, contextId, isWidget);
  const { data: channelData } = useChannel(channelId, workspaceSlug);
  const { sendMessageMutation, replyToMessageMutation, addReactionMutation, removeReactionMutation, markMessagesAsReadMutation } = useChannelMutations(workspaceSlug, isWidget);

  const [viewedChannels] = useState(() => new Set<string>());
  const [replyingTo, setReplyingTo] = useState<{ id: string; userName: string } | null>(null);
  const [activeThread, setActiveThread] = useState<any | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const highlightedMessageRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const markedMessageIds = useRef<Set<string>>(new Set());

  const { data: session } = useSession();
  const currentUser = session?.user;
  const dmUserId = channelId.startsWith('dm-') ? channelId.replace('dm-', '') : null;
  const { data: dmUser } = useUser(dmUserId || '');
  const { data: socialProfile } = useUserSocialProfile(dmUserId || '');
  const { sendFriendRequestMutation, respondToFriendRequestMutation, friendRequests, blockUserMutation, unblockUserMutation } = useSocialActions(dmUserId);

  const handleSendFriendRequest = useCallback(() => {
    if (!dmUserId || !socialProfile) return;
    if (socialProfile.friendRequestStatus === 'pending' && socialProfile.friendRequestSide === 'receiver') {
      const request = friendRequests?.find((r: any) => r.senderId === dmUserId);
      if (request) {
        respondToFriendRequestMutation.mutate({ requestId: request.id, action: 'accept' }, {
          onSuccess: () => {
            toast.success('Friend request accepted!');
            queryClient.invalidateQueries({ queryKey: userKeys.socialProfile(dmUserId) });
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
          },
        });
        return;
      }
    }
    sendFriendRequestMutation.mutate({ receiverId: dmUserId }, {
      onSuccess: () => {
        toast.success('Friend request sent!');
        queryClient.invalidateQueries({ queryKey: userKeys.socialProfile(dmUserId) });
      },
      onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to send friend request'),
    });
  }, [dmUserId, socialProfile, friendRequests, respondToFriendRequestMutation, sendFriendRequestMutation, queryClient]);

  const handleBlockUser = useCallback(() => {
    if (!dmUserId) return;
    if (socialProfile?.isBlockedByMe) {
      unblockUserMutation.mutate(dmUserId, { onSuccess: () => toast.success('User unblocked') });
    } else {
      blockUserMutation.mutate(dmUserId, { onSuccess: () => toast.success('User blocked') });
    }
  }, [dmUserId, socialProfile, blockUserMutation, unblockUserMutation]);

  useRealtimeSubscriptions(channelId, workspaceSlug, queryClient, currentUser?.id, initialThreadId);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [channelForm, setChannelForm] = useState({ name: '', description: '', type: 'public' as 'public' | 'private' });

  useEffect(() => {
    if (channelData) setChannelForm({ name: channelData.name, description: channelData.description || '', type: (channelData as any).isPrivate ? 'private' : 'public' });
  }, [channelData]);

  const messages = useMemo(() => messagesData?.pages?.flatMap(page => page.messages) || [], [messagesData]);

  const { isAtBottom, hasInitialScrolled, setHasInitialScrolled } = useChannelViewScroll(
    messages, isLoading, highlightedMessageId, null, highlightedMessageRef, firstUnreadRef, messagesEndRef
  );

  const { initialUnreadId, setInitialUnreadId } = useUnreadLineLogic(
    messages, isLoading, hasInitialScrolled, channelId, viewedChannels, isAtBottom, currentUser?.id
  );

  useEffect(() => {
    markedMessageIds.current.clear();
    setHasInitialScrolled(false);
    setInitialUnreadId(null);
  }, [channelId, setHasInitialScrolled, setInitialUnreadId]);

  useReadReceipts(channelId, scrollAreaRef, markedMessageIds, messages, currentUser?.id, markMessagesAsReadMutation);

  const organizeMessages = useCallback((msgs: Message[], unreadId: string | null) => {
    const list: Array<{ type: 'message'; data: Message; depth: number } | { type: 'date'; date: Date } | { type: 'unread' }> = [];
    const messageMap = new Map<string, Message & { replies: Message[] }>();
    msgs.forEach(msg => messageMap.set(msg.id, { ...msg, replies: [] }));
    // If we're in a thread view, we don't want to group by replyTo if it's not the thread root
    const rootMessages = msgs
      .filter(msg => {
        if (initialThreadId) return true; // In thread view, treat all as root for flattening or handle differently
        return !msg.replyTo || !messageMap.has(msg.replyTo);
      })
      .map(msg => messageMap.get(msg.id)!);
    msgs.forEach(msg => { if (msg.replyTo && messageMap.has(msg.replyTo)) messageMap.get(msg.replyTo)!.replies.push(messageMap.get(msg.id)!); });
    rootMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let lastDate: Date | null = null;
    const addToList = (msg: Message, depth: number) => {
      const d = new Date(msg.timestamp);
      if (!lastDate || d.toDateString() !== lastDate.toDateString()) { list.push({ type: 'date', date: d }); lastDate = d; }
      if (msg.id === unreadId) list.push({ type: 'unread' });
      list.push({ type: 'message', data: msg, depth });
    };
    rootMessages.forEach(rm => {
      addToList(rm, 0);
      if (!initialThreadId) {
        rm.replies.forEach(r => addToList(r, 1));
      }
    });
    return list;
  }, []);

  const renderList = useMemo(() => organizeMessages(messages, initialUnreadId), [messages, initialUnreadId, organizeMessages]);

  const handleSendMessage = useCallback((content: string, attachments?: UploadedFile[]) => {
    if (!channelId) return;
    const p = { channelId, content, mentions: [], messageType: 'standard' as const, attachments, threadId: initialThreadId, contextId };
    if (replyingTo) replyToMessageMutation.mutate({ ...p, messageId: replyingTo.id, attachments }, { onSuccess: () => setReplyingTo(null), onError: () => toast.error('Failed to send reply.') });
    else sendMessageMutation.mutate(p, { onError: () => toast.error('Failed to send message.') });
  }, [channelId, initialThreadId, contextId, replyingTo, replyToMessageMutation, sendMessageMutation]);

  const handleReply = useCallback((id: string) => {
    const m = messages.find(msg => msg.id === id);
    if (m) setReplyingTo({ id, userName: (m as any).user?.name || 'Unknown' });
  }, [messages]);

  const handleOpenThread = useCallback((m: any) => setActiveThread(m), []);

  const handleReaction = useCallback((id: string, emoji: string, isCustom?: boolean, customEmojiId?: string) => {
    const m = messages.find(msg => msg.id === id);
    if (!m) return;
    if (m.reactions.find(r => r.emoji === emoji)?.users.includes(currentUser?.id || '')) removeReactionMutation.mutate({ messageId: id, emoji, channelId, workspaceSlug });
    else addReactionMutation.mutate({ messageId: id, emoji, channelId, isCustom, customEmojiId, workspaceSlug });
  }, [messages, currentUser?.id, channelId, workspaceSlug, removeReactionMutation, addReactionMutation]);

  const isDm = channelId.startsWith('dm-');

  const placeholderText = useMemo(() => {
    if (replyingTo) return `Replying to @${replyingTo.userName}`;
    if (channelId.startsWith('dm-')) {
      return `Message @${dmUser?.name || 'User'}`;
    }
    return `Message #${channelData?.name || channelId || 'thread'}`;
  }, [replyingTo, channelId, dmUser, channelData]);

  return (
    <div className={cn('flex h-full w-full bg-background overflow-hidden relative', isWidget && 'border-none')}>
      <div className="flex-1 flex flex-col min-w-0">
        <ChannelHeader
          isWidget={isWidget}
          channelName={channelData?.name || (channelId.startsWith('dm-') ? `@${dmUser?.name || 'User'}` : channelId) || 'general'}
          channelDescription={(channelData as any)?.description}
          memberCount={(channelData as any)?._count?.members ?? (channelData as any)?.memberCount}
          isPrivate={(channelData as any)?.isPrivate || (channelData as any)?.type === 'private'}
          onEdit={() => setEditDialogOpen(true)}
          onToggleInfo={onToggleInfo}
          onToggleSidebar={onToggleSidebar}
        />

        {isDm && dmUserId && currentUser?.id && dmUserId !== currentUser.id && socialProfile && !socialProfile.isFriend && !isWidget && (
          <SocialBanner
            dmUser={dmUser}
            socialProfile={socialProfile}
            handleBlockUser={handleBlockUser}
            handleSendFriendRequest={handleSendFriendRequest}
            isBlockPending={blockUserMutation.isPending || unblockUserMutation.isPending}
            isFriendRequestPending={sendFriendRequestMutation.isPending}
          />
        )}

        <MessageList
          scrollAreaRef={scrollAreaRef}
          messagesEndRef={messagesEndRef}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
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
          activeChannelId={channelId}
          channelName={channelData?.name}
        />

        <div className="shrink-0 px-6 py-6 bg-background">
          <MessageComposer
            onSend={handleSendMessage}
            placeholder={placeholderText}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            channelId={channelId}
          />
        </div>

        <EditChannelDialog
          editChannelOpen={editDialogOpen}
          setEditChannelOpen={setEditDialogOpen}
          channelForm={channelForm}
          setChannelForm={setChannelForm}
          handleEditChannel={() => setEditDialogOpen(false)}
          channelId={channelId}
        />
      </div>

      {activeThread && (
        <ThreadPanel
          rootMessage={activeThread}
          onClose={() => setActiveThread(null)}
          workspaceId={workspaceSlug}
          channelId={channelId}
          channelName={channelData?.name}
        />
      )}
    </div>
  );
}
