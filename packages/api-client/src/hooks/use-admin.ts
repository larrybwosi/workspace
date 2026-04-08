import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../client"

// Admin stats
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/stats")
      return response.data
    },
  })
}

// Admin members
export function useAdminMembers(filters?: { search?: string; role?: string; status?: string }) {
  return useQuery({
    queryKey: ["admin", "members", filters],
    queryFn: async () => {
      const response = await apiClient.get("/admin/members", { params: filters })
      return response.data
    },
  })
}

// Update member role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiClient.patch(`/admin/members/${userId}/role`, { role })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] })
    },
  })
}

// Admin assets
export function useAdminAssets(type: string) {
  return useQuery({
    queryKey: ["admin", "assets", type],
    queryFn: async () => {
      const response = await apiClient.get("/admin/assets", { params: { type } })
      return response.data
    },
  })
}

// Create asset
export function useCreateAdminAsset() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ type, data }: { type: string; data: any }) => {
            const response = await apiClient.post("/admin/assets", { type, data })
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "assets", variables.type] })
        }
    })
}

// Update asset
export function useUpdateAdminAsset() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ type, id, data }: { type: string; id: string; data: any }) => {
            const response = await apiClient.patch("/admin/assets", { type, id, data })
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "assets", variables.type] })
        }
    })
}

// Delete asset
export function useDeleteAdminAsset() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ type, id }: { type: string; id: string }) => {
            const response = await apiClient.delete("/admin/assets", { params: { type, id } })
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "assets", variables.type] })
        }
    })
}

// Upload file
export function useAdminUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const response = await apiClient.post("/admin/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    },
  })
}
