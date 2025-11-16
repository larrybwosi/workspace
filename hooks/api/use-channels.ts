import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Channel } from "@/lib/types"

// Query keys for cache management
export const channelKeys = {
  all: ["channels"] as const,
  lists: () => [...channelKeys.all, "list"] as const,
  list: (filters: string) => [...channelKeys.lists(), { filters }] as const,
  details: () => [...channelKeys.all, "detail"] as const,
  detail: (id: string) => [...channelKeys.details(), id] as const,
}

// Fetch all channels
export function useChannels() {
  return useQuery({
    queryKey: channelKeys.lists(),
    queryFn: async () => {
      const { data } = await apiClient.get<Channel[]>("/channels")
      return data
    },
  })
}

// Fetch single channel
export function useChannel(id: string) {
  return useQuery({
    queryKey: channelKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Channel>(`/channels/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Create channel
export function useCreateChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newChannel: Omit<Channel, "id">) => {
      const { data } = await apiClient.post<Channel>("/channels", newChannel)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}

// Update channel
export function useUpdateChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Channel> & { id: string }) => {
      const { data } = await apiClient.patch<Channel>(`/channels/${id}`, updates)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}

// Delete channel
export function useDeleteChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/channels/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}

// Join channel
export function useJoinChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelId: string) => {
      const { data } = await apiClient.post(`/channels/${channelId}/join`)
      return data
    },
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) })
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}

// Leave channel
export function useLeaveChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelId: string) => {
      await apiClient.post(`/channels/${channelId}/leave`)
      return channelId
    },
    onSuccess: (channelId) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) })
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}
