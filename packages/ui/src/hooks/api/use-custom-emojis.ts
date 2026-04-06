import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export function useCustomEmojis(workspaceId: string) {
  return useQuery({
    queryKey: ["custom-emojis", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/emojis`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateCustomEmoji(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; shortcode: string; imageUrl: string }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceId}/emojis`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-emojis", workspaceId] })
    },
  })
}
