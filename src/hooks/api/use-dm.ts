import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

// Get all DM conversations
export function useDMConversations() {
  return useQuery({
    queryKey: ["dm-conversations"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/dm`)
      return data
    },
  })
}

// Get specific DM conversation
export function useDMConversation(conversationId: string) {
  return useQuery({
    queryKey: ["dm-conversation", conversationId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/dm/${conversationId}`)
      return data
    },
    enabled: !!conversationId,
  })
}

// Get DM messages with infinite scroll
export function useDMMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ["dm-messages", conversationId],
    queryFn: async ({ pageParam }) => {
      const { data } = await axios.get(`${API_URL}/api/dm/${conversationId}/messages`, {
        params: {
          cursor: pageParam,
          limit: 50,
        },
      })
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!conversationId,
    initialPageParam: undefined,
  })
}

// Create or get DM conversation
export function useCreateDMConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await axios.post(`${API_URL}/api/dm`, { userId })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dm-conversations"] })
    },
  })
}

// Send DM message
export function useSendDMMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      messageType,
      metadata,
      replyToId,
    }: {
      conversationId: string
      content: string
      messageType?: string
      metadata?: any
      replyToId?: string
    }) => {
      const { data } = await axios.post(`${API_URL}/api/dm/${conversationId}/messages`, {
        content,
        messageType,
        metadata,
        replyToId,
      })
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dm-messages", variables.conversationId] })
      queryClient.invalidateQueries({ queryKey: ["dm-conversations"] })
      queryClient.invalidateQueries({ queryKey: ["dm-conversation", variables.conversationId] })
    },
  })
}

// Delete DM conversation
export function useDeleteDMConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data } = await axios.delete(`${API_URL}/api/dm/${conversationId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dm-conversations"] })
    },
  })
}

// Mark DM as read
export function useMarkDMAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data } = await axios.post(`${API_URL}/api/dm/${conversationId}/mark-read`)
      return data
    },
    onSuccess: (data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["dm-conversation", conversationId] })
      queryClient.invalidateQueries({ queryKey: ["dm-conversations"] })
    },
  })
}
