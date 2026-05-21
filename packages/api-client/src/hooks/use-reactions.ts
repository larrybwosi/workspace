import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { messageKeys } from './use-messages';
import type { Message } from '@repo/types';

// Add reaction to message
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
      channelId,
      isCustom,
      customEmojiId,
      workspaceSlug,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
      isCustom?: boolean;
      customEmojiId?: string;
      workspaceSlug?: string;
    }) => {
      const url = workspaceSlug
        ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages/${messageId}/reactions`
        : `/channels/${channelId}/messages/${messageId}/reactions`;
      const { data } = await apiClient.post(url, { emoji, isCustom, customEmojiId });
      return { data, channelId, workspaceSlug };
    },
    onMutate: async ({ messageId, emoji, channelId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: messageKeys.list(channelId) });

      const previousMessages = queryClient.getQueryData(messageKeys.list(channelId));

      queryClient.setQueryData(messageKeys.list(channelId), (old: unknown) => {
        if (!old) return old;
        const oldData = old as { pages: { messages: Message[] }[] };
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            messages: page.messages.map(msg => {
              if (msg.id === messageId) {
                const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
                if (existingReaction) {
                  return {
                    ...msg,
                    reactions: msg.reactions.map(r => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r)),
                  };
                }
                return {
                  ...msg,
                  reactions: [...(msg.reactions || []), { emoji, count: 1, users: [] }],
                };
              }
              return msg;
            }),
          })),
        };
      });

      return { previousMessages };
    },
    onError: (_err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageKeys.list(variables.channelId), context.previousMessages);
      }
    },
    onSuccess: ({ channelId, workspaceSlug }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceSlug) });
    },
  });
}

// Remove reaction from message
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
      channelId,
      workspaceSlug,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
      workspaceSlug?: string;
    }) => {
      const url = workspaceSlug
        ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages/${messageId}/reactions/${emoji}`
        : `/channels/${channelId}/messages/${messageId}/reactions/${emoji}`;
      await apiClient.delete(url);
      return { messageId, emoji, channelId, workspaceSlug };
    },
    onSuccess: ({ channelId, workspaceSlug }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceSlug) });
    },
  });
}
