import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { messageKeys } from "./use-messages"

// Add reaction to message
export function useAddReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, emoji, channelId }: { messageId: string; emoji: string; channelId: string }) => {
      const { data } = await apiClient.post(`/messages/${messageId}/reactions`, { emoji })
      return { data, channelId }
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
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId) })
    },
  })
}

// Remove reaction from message
export function useRemoveReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, emoji, channelId }: { messageId: string; emoji: string; channelId: string }) => {
      await apiClient.delete(`/messages/${messageId}/reactions/${emoji}`)
      return { messageId, emoji, channelId }
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId) })
    },
  })
}
