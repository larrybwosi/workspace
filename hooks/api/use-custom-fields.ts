import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { CustomField } from "@/lib/types"

export const customFieldKeys = {
  all: ["customFields"] as const,
  entity: (entityType: "project" | "task") => [...customFieldKeys.all, entityType] as const,
}

// Fetch custom fields for entity type
export function useCustomFields(entityType: "project" | "task") {
  return useQuery({
    queryKey: customFieldKeys.entity(entityType),
    queryFn: async () => {
      const { data } = await apiClient.get<CustomField[]>(`/custom-fields/${entityType}`)
      return data
    },
  })
}

// Create custom field
export function useCreateCustomField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (field: Omit<CustomField, "id">) => {
      const { data } = await apiClient.post<CustomField>("/custom-fields", field)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.entity(data.entityType) })
    },
  })
}

// Update custom field
export function useUpdateCustomField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomField> & { id: string }) => {
      const { data } = await apiClient.patch<CustomField>(`/custom-fields/${id}`, updates)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.entity(data.entityType) })
    },
  })
}

// Delete custom field
export function useDeleteCustomField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, entityType }: { id: string; entityType: "project" | "task" }) => {
      await apiClient.delete(`/custom-fields/${id}`)
      return entityType
    },
    onSuccess: (entityType) => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.entity(entityType) })
    },
  })
}
