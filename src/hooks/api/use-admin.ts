import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

// Admin stats
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/admin/stats`)
      return response.data
    },
  })
}

// Admin members
export function useAdminMembers() {
  return useQuery({
    queryKey: ["admin", "members"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/admin/members`)
      return response.data
    },
  })
}

// Update member role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await axios.patch(`${API_BASE}/api/admin/members/${userId}/role`, { role })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] })
    },
  })
}
