import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

interface Comment {
  id: string
  userId: string
  content: string
  timestamp: Date
  taskId?: string
  messageId?: string
}

export const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (entityType: string, entityId: string) => [...commentKeys.lists(), entityType, entityId] as const,
}

// Fetch comments for a task or message
export function useComments(entityType: "task" | "message", entityId: string) {
  return useQuery({
    queryKey: commentKeys.list(entityType, entityId),
    queryFn: async () => {
      const { data } = await apiClient.get<Comment[]>(`/${entityType}s/${entityId}/comments`)
      return data
    },
    enabled: !!entityId,
  })
}

// Add comment
export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      content,
    }: {
      entityType: "task" | "message"
      entityId: string
      content: string
    }) => {
      const { data } = await apiClient.post<Comment>(`/${entityType}s/${entityId}/comments`, { content })
      return { data, entityType, entityId }
    },
    onSuccess: ({ entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(entityType, entityId) })
    },
  })
}

// Delete comment
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      entityType,
      entityId,
    }: {
      commentId: string
      entityType: "task" | "message"
      entityId: string
    }) => {
      await apiClient.delete(`/comments/${commentId}`)
      return { entityType, entityId }
    },
    onSuccess: ({ entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(entityType, entityId) })
    },
  })
}
