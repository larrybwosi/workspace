import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Attachment } from "@/lib/types"

// Upload file
export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      entityType,
      entityId,
    }: {
      file: File
      entityType: "message" | "task" | "project"
      entityId: string
    }) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("entityType", entityType)
      formData.append("entityId", entityId)

      const { data } = await apiClient.post<Attachment>("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return { data, entityType, entityId }
    },
    onSuccess: ({ entityType, entityId }) => {
      // Invalidate relevant queries based on entity type
      queryClient.invalidateQueries({ queryKey: [entityType + "s", entityId] })
    },
  })
}

// Delete file
export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fileId,
      entityType,
      entityId,
    }: {
      fileId: string
      entityType: "message" | "task" | "project"
      entityId: string
    }) => {
      await apiClient.delete(`/files/${fileId}`)
      return { entityType, entityId }
    },
    onSuccess: ({ entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: [entityType + "s", entityId] })
    },
  })
}
