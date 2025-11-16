import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { WBSNode } from "@/lib/types"

export const wbsKeys = {
  all: ["wbs"] as const,
  project: (projectId: string) => [...wbsKeys.all, projectId] as const,
}

// Fetch WBS for a project
export function useWBS(projectId: string) {
  return useQuery({
    queryKey: wbsKeys.project(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<WBSNode[]>(`/projects/${projectId}/wbs`)
      return data
    },
    enabled: !!projectId,
  })
}

// Update WBS node
export function useUpdateWBSNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      nodeId,
      updates,
    }: { projectId: string; nodeId: string; updates: Partial<WBSNode> }) => {
      const { data } = await apiClient.patch<WBSNode>(`/projects/${projectId}/wbs/${nodeId}`, updates)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.project(projectId) })
    },
  })
}

// Create WBS node
export function useCreateWBSNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      parentId,
      node,
    }: { projectId: string; parentId?: string; node: Omit<WBSNode, "id"> }) => {
      const { data } = await apiClient.post<WBSNode>(`/projects/${projectId}/wbs`, { ...node, parentId })
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.project(projectId) })
    },
  })
}

// Delete WBS node
export function useDeleteWBSNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, nodeId }: { projectId: string; nodeId: string }) => {
      await apiClient.delete(`/projects/${projectId}/wbs/${nodeId}`)
      return { projectId, nodeId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.project(projectId) })
    },
  })
}
