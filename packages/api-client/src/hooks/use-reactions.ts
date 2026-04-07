import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../client"
import { messageKeys } from "./use-messages"

// Add reaction to message
export function useAddReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, emoji, channelId, isCustom, customEmojiId, workspaceId }: {
      messageId: string;
      emoji: string;
      channelId: string;
      isCustom?: boolean;
      customEmojiId?: string;
      workspaceId?: string;
    }) => {
      const url = workspaceId
        ? `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/reactions`
        : `/channels/${channelId}/messages/${messageId}/reactions`;
      const { data } = await apiClient.post(url, { emoji, isCustom, customEmojiId })
      return { data, channelId, workspaceId }
    },
    onMutate: async ({ messageId, emoji, channelId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: messageKeys.list(channelId) })

      const previousMessages = queryClient.getQueryData(messageKeys.list(channelId))

      queryClient.setQueryData(messageKeys.list(channelId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((msg: any) => {
              if (msg.id === messageId) {
                const existingReaction = msg.reactions?.find((r: any) => r.emoji === emoji)
                if (existingReaction) {
                  return {
                    ...msg,
                    reactions: msg.reactions.map((r: any) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r)),
                  }
                }
                return {
                  ...msg,
                  reactions: [...(msg.reactions || []), { emoji, count: 1, users: [] }],
                }
              }
              return msg
            }),
          })),
        }
      })

      return { previousMessages }
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageKeys.list(variables.channelId), context.previousMessages)
      }
    },
    onSuccess: ({ channelId, workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceId) })
    },
  })
}

// Remove reaction from message
export function useRemoveReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, emoji, channelId, workspaceId }: {
      messageId: string;
      emoji: string;
      channelId: string;
      workspaceId?: string;
    }) => {
      const url = workspaceId
        ? `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/reactions/${emoji}`
        : `/channels/${channelId}/messages/${messageId}/reactions/${emoji}`;
      await apiClient.delete(url)
      return { messageId, emoji, channelId, workspaceId }
    },
    onSuccess: ({ channelId, workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceId) })
    },
  })
}
