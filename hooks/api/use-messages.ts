import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Message } from "@/lib/types"

export const messageKeys = {
  all: ["messages"] as const,
  lists: () => [...messageKeys.all, "list"] as const,
  list: (channelId: string) => [...messageKeys.lists(), channelId] as const,
  details: () => [...messageKeys.all, "detail"] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
}

// Fetch messages with infinite scroll
export function useMessages(channelId: string) {
  return useInfiniteQuery({
    queryKey: messageKeys.list(channelId),
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await apiClient.get<{ messages: Message[]; nextCursor: number | null }>(
        `/channels/${channelId}/messages`,
        { params: { cursor: pageParam, limit: 50 } },
      )
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!channelId,
    initialPageParam: 0,
  })
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ channelId, ...message }: Omit<Message, "id" | "timestamp" | "reactions" | "userId"> & { channelId: string }) => {
      const { data } = await apiClient.post<Message>(`/channels/${channelId}/messages`, message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(variables.channelId) })
    },
  })
}

// Update message
export function useUpdateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, channelId, ...updates }: Partial<Message> & { id: string; channelId: string }) => {
      const { data } = await apiClient.patch<Message>(`/messages/${id}`, updates)
      return { data, channelId }
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId) })
    },
  })
}

// Delete message
export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, channelId }: { id: string; channelId: string }) => {
      await apiClient.delete(`/messages/${id}`)
      return { id, channelId }
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId) })
    },
  })
}

// Reply to message
export function useReplyToMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      channelId,
      ...reply
    }: Omit<Message, "id" | "timestamp" | "reactions" | "userId"> & { messageId: string; channelId: string }) => {
      const { data } = await apiClient.post<Message>(`/messages/${messageId}/replies`, reply)
      return { data, channelId }
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId) })
    },
  })
}

// Mark message as read mutation
export function useMarkMessageAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, channelId }: { messageId: string; channelId: string }) => {
      const { data } = await apiClient.post(`/messages/${messageId}/read`, {})
      return { data, channelId }
    },
  })
}

export const dmKeys = {
  all: ["dms"] as const,
  lists: () => [...dmKeys.all, "list"] as const,
  list: (dmId: string) => [...dmKeys.lists(), dmId] as const,
  conversations: () => [...dmKeys.all, "conversations"] as const,
}

// Fetch all DM conversations
export function useDMConversations() {
  return useQuery({
    queryKey: dmKeys.conversations(),
    queryFn: async () => {
      const { data } = await apiClient.get("/dms")
      return data
    },
  })
}

// Create or get DM
export function useCreateDM() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.post("/dms", { userId })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmKeys.conversations() })
    },
  })
}

// Fetch DM messages with pagination
export function useDMMessages(dmId: string) {
  return useInfiniteQuery({
    queryKey: dmKeys.list(dmId),
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get(`/dms/${dmId}/messages`, {
        params: { cursor: pageParam, limit: 50 },
      })
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!dmId,
    initialPageParam: undefined,
  })
}

// Send DM message
export function useSendDMMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dmId, content, replyToId, attachments }: {
      dmId: string
      content: string
      replyToId?: string
      attachments?: any[]
    }) => {
      const { data } = await apiClient.post(`/dms/${dmId}/messages`, {
        content,
        replyToId,
        attachments,
      })
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dmKeys.list(variables.dmId) })
      queryClient.invalidateQueries({ queryKey: dmKeys.conversations() })
    },
  })
}
