import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../client"

export function useSupportTickets(workspaceId: string) {
  return useQuery({
    queryKey: ["support-tickets", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get("/support/tickets", { params: { workspaceId } })
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { workspaceId: string; subject: string; initialMessage?: string }) => {
      const { data: response } = await apiClient.post("/support/tickets", data)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets", variables.workspaceId] })
    },
  })
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const { data } = await apiClient.patch(`/support/tickets/${ticketId}/status`, { status })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets", data.workspaceId] })
    },
  })
}

export function useCustomerProfiles(workspaceId: string) {
  return useQuery({
    queryKey: ["customer-profiles", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get("/support/customers", { params: { workspaceId } })
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await apiClient.post("/support/customers", data)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-profiles", variables.workspaceId] })
    },
  })
}
