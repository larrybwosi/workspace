import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../client"

export function useCustomEmojis(workspaceSlug: string) {
  return useQuery({
    queryKey: ["custom-emojis", workspaceSlug],
    queryFn: async () => {
      if (!workspaceSlug) return []
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/emojis`)
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useCreateCustomEmoji(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; shortcode: string; imageUrl: string }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceSlug}/emojis`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-emojis", workspaceSlug] })
    },
  })
}
