import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../client"

interface InvitationData {
  email: string
  role?: string
  projectId?: string
  channelId?: string
  permissions?: Record<string, boolean>
}

interface AcceptInvitationData {
  name: string
  password: string
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: InvitationData) => {
      const response = await apiClient.post("/invitations", data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] })
    },
  })
}

export function useInvitation(token: string | null) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      if (!token) return null
      const response = await apiClient.get(`/invitations/${token}`)
      return response.data
    },
    enabled: !!token,
  })
}

export function useAcceptInvitation(token: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/invitations/${token}/accept`, {})
      return response.data
    },
  })
}

export function useInvitations(workspaceId?: string) {
  return useQuery({
    queryKey: ["invitations", workspaceId],
    queryFn: async () => {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : ""
      const response = await apiClient.get(`/invitations${params}`)
      return response.data.invitations
    },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await apiClient.post(`/invitations/${token}/resend`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] })
    },
  })
}
