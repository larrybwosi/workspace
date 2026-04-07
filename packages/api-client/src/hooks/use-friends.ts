import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

export function useFriends(search?: string) {
  return useQuery({
    queryKey: ["friends", search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : ""
      const response = await axios.get(`/api/friends${params}`)
      return response.data.friends
    },
  })
}

export function useFriendRequests(type?: "sent" | "received", status?: string) {
  return useQuery({
    queryKey: ["friend-requests", type, status],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (type) params.append("type", type)
      if (status) params.append("status", status)
      const query = params.toString() ? `?${params.toString()}` : ""
      const response = await axios.get(`/api/friends/requests${query}`)
      return response.data.requests
    },
  })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { receiverId: string; message?: string }) => {
      const response = await axios.post("/api/friends/requests", data)
      return response.data.request
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] })
    },
  })
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: "accept" | "decline" | "cancel" }) => {
      const response = await axios.patch(`/api/friends/requests/${requestId}`, { action })
      return response.data.request
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] })
      queryClient.invalidateQueries({ queryKey: ["friends"] })
    },
  })
}

export function useUpdateFriend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ friendId, nickname }: { friendId: string; nickname?: string }) => {
      const response = await axios.patch(`/api/friends/${friendId}`, { nickname })
      return response.data.friend
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] })
    },
  })
}

export function useRemoveFriend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (friendId: string) => {
      await axios.delete(`/api/friends/${friendId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] })
    },
  })
}
