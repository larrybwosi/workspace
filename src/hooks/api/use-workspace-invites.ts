import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export function useWorkspaceInviteLinks(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-invite-links", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/invite-links`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspaceInviteLink(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { maxUses?: number; expiresAt?: string }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceId}/invite-links`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invite-links", workspaceId] })
    },
  })
}

export function useDeleteWorkspaceInviteLink(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (linkId: string) => {
      await apiClient.delete(`/workspaces/${workspaceId}/invite-links/${linkId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invite-links", workspaceId] })
    },
  })
}
