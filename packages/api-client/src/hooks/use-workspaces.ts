import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../client"

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const { data } = await apiClient.get("/workspaces")
      return data
    },
  })
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; icon?: string; description?: string }) => {
      const { data: response } = await apiClient.post("/workspaces", data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
    },
  })
}

export function useUpdateWorkspace(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name?: string; icon?: string; description?: string }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId] })
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
    },
  })
}

export function useInviteToWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      workspaceId,
      userId,
      email,
      role,
    }: { workspaceId: string; userId?: string; email?: string; role?: string }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceId}/invitations`, { userId, email, role })
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", variables.workspaceId] })
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations", variables.workspaceId] })
    },
  })
}

export function useWorkspaceInvitations(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-invitations", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/invitations`)
      return data.invitations
    },
  })
}

export function useAcceptWorkspaceInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceId}/invitations/${invitationId}`, { action: "accept" })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations"] })
    },
  })
}

export function useDeclineWorkspaceInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceId}/invitations/${invitationId}`, { action: "decline" })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations"] })
    },
  })
}

export function useCancelWorkspaceInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) => {
      const { data: response } = await apiClient.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations", variables.workspaceId] })
    },
  })
}

export function useWorkspaceAnalytics(workspaceId: string, range = "30d") {
  return useQuery({
    queryKey: ["workspace-analytics", workspaceId, range],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/analytics`, { params: { range } })
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/members`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useUpdateWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { data } = await apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] })
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId] })
    },
  })
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] })
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId] })
    },
  })
}

export function useDeleteWorkspace(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
    },
  })
}

export function useWorkspaceAuditLogs(workspaceId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ["workspace-audit-logs", workspaceId, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/audit-logs`, { params: { page, limit } })
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useWorkspaceIntegrations(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-integrations", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/integrations`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspaceIntegration(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      service: string
      name: string
      config: Record<string, any>
      description?: string
    }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceId}/integrations`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceId] })
    },
  })
}

export function useUpdateWorkspaceIntegration(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      integrationId,
      data,
    }: {
      integrationId: string
      data: { config?: Record<string, any>; active?: boolean }
    }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceId}/integrations/${integrationId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceId] })
    },
  })
}

export function useDeleteWorkspaceIntegration(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceId}/integrations/${integrationId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceId] })
    },
  })
}

export function useTestWorkspaceIntegration(workspaceId: string) {
  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { data } = await apiClient.post(`/workspaces/${workspaceId}/integrations/${integrationId}/test`)
      return data
    },
  })
}

export function useWorkspaceDepartments(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-departments", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/departments`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateDepartment(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      slug: string
      description?: string
      icon?: string
      color?: string
      parentId?: string
      managerId?: string
      createChannel?: boolean
    }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceId}/departments`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-departments", workspaceId] })
    },
  })
}

export function useUpdateDepartment(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      departmentId,
      data,
    }: {
      departmentId: string
      data: { name?: string; description?: string; icon?: string; color?: string; managerId?: string }
    }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceId}/departments/${departmentId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-departments", workspaceId] })
    },
  })
}

export function useDeleteDepartment(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (departmentId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceId}/departments/${departmentId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-departments", workspaceId] })
    },
  })
}

export function useWorkspaceTeams(workspaceId: string, departmentId?: string) {
  return useQuery({
    queryKey: ["workspace-teams", workspaceId, departmentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/teams`, { params: { departmentId } })
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateTeam(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      slug: string
      description?: string
      icon?: string
      color?: string
      departmentId?: string
      leadId?: string
      memberIds?: string[]
      createChannel?: boolean
    }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceId}/teams`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-teams", workspaceId] })
    },
  })
}

export function useWorkspaceApiTokens(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-api-tokens", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/api-tokens`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspaceApiToken(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      permissions: {
        departments?: string[]
        teams?: string[]
        actions: string[]
      }
      rateLimit?: number
      expiresAt?: string
    }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceId}/api-tokens`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-api-tokens", workspaceId] })
    },
  })
}

export function useWorkspaceChannels(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-channels", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/channels`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspaceChannel(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      type?: "public" | "private"
      departmentId?: string
      icon?: string
    }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceId}/channels`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-channels", workspaceId] })
    },
  })
}

export function useUpdateWorkspaceChannel(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channelId,
      data,
    }: {
      channelId: string
      data: { name?: string; description?: string; type?: "public" | "private"; icon?: string }
    }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceId}/channels/${channelId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-channels", workspaceId] })
    },
  })
}

export function useDeleteWorkspaceChannel(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (channelId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceId}/channels/${channelId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-channels", workspaceId] })
    },
  })
}

export function useWorkspaceProjects(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-projects", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/projects`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspaceProject(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      icon?: string
      status?: string
      priority?: string
      startDate: string
      endDate: string
      departmentId?: string
      memberIds?: string[]
    }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceId}/projects`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-projects", workspaceId] })
    },
  })
}

export function useUpdateWorkspaceProject(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string
      data: { name?: string; description?: string; icon?: string; status?: string; priority?: string; endDate?: string }
    }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceId}/projects/${projectId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-projects", workspaceId] })
    },
  })
}

export function useDeleteWorkspaceProject(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceId}/projects/${projectId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-projects", workspaceId] })
    },
  })
}
