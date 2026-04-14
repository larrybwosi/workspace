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

export function useGenerateInviteLink() {
  return useMutation({
    mutationFn: async (workspaceSlug: string) => {
      const { data } = await apiClient.post(`/workspaces/${workspaceSlug}/invite-links`, {})
      return data
    },
  })
}

export function useWorkspace(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}`)
      return data
    },
    enabled: !!workspaceSlug,
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

export function useUpdateWorkspace(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name?: string; icon?: string; description?: string }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceSlug}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceSlug] })
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
    },
  })
}

export function useInviteToWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      workspaceSlug,
      userId,
      email,
      role,
    }: { workspaceSlug: string; userId?: string; email?: string; role?: string }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceSlug}/invitations`, { userId, email, role })
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", variables.workspaceSlug] })
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations", variables.workspaceSlug] })
    },
  })
}

export function useWorkspaceInvitations(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspace-invitations", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/invitations`)
      return data.invitations
    },
  })
}

export function useAcceptWorkspaceInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ workspaceSlug, invitationId }: { workspaceSlug: string; invitationId: string }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceSlug}/invitations/${invitationId}`, { action: "accept" })
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
    mutationFn: async ({ workspaceSlug, invitationId }: { workspaceSlug: string; invitationId: string }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceSlug}/invitations/${invitationId}`, { action: "decline" })
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
    mutationFn: async ({ workspaceSlug, invitationId }: { workspaceSlug: string; invitationId: string }) => {
      const { data: response } = await apiClient.delete(`/workspaces/${workspaceSlug}/invitations/${invitationId}`)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations", variables.workspaceSlug] })
    },
  })
}

export function useWorkspaceAnalytics(workspaceSlug: string, range = "30d") {
  return useQuery({
    queryKey: ["workspace-analytics", workspaceSlug, range],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/analytics`, { params: { range } })
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useWorkspaceMembers(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspace-members", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/members`)
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useUpdateWorkspaceMember(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { data } = await apiClient.patch(`/workspaces/${workspaceSlug}/members/${memberId}`, { role })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceSlug] })
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceSlug] })
    },
  })
}

export function useRemoveWorkspaceMember(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceSlug}/members/${memberId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceSlug] })
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceSlug] })
    },
  })
}

export function useDeleteWorkspace(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceSlug}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
    },
  })
}

export function useWorkspaceAuditLogs(workspaceSlug: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ["workspace-audit-logs", workspaceSlug, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/audit-logs`, { params: { page, limit } })
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useWorkspaceIntegrations(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspace-integrations", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/integrations`)
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useCreateWorkspaceIntegration(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      service: string
      name: string
      config: Record<string, any>
      description?: string
    }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceSlug}/integrations`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceSlug] })
    },
  })
}

export function useUpdateWorkspaceIntegration(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      integrationId,
      data,
    }: {
      integrationId: string
      data: { config?: Record<string, any>; active?: boolean }
    }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceSlug}/integrations/${integrationId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceSlug] })
    },
  })
}

export function useDeleteWorkspaceIntegration(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceSlug}/integrations/${integrationId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceSlug] })
    },
  })
}

export function useTestWorkspaceIntegration(workspaceSlug: string) {
  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { data } = await apiClient.post(`/workspaces/${workspaceSlug}/integrations/${integrationId}/test`)
      return data
    },
  })
}

export function useWorkspaceDepartments(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspace-departments", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/departments`)
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useCreateDepartment(workspaceSlug: string) {
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
      const { data: response } = await apiClient.post(`/workspaces/${workspaceSlug}/departments`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-departments", workspaceSlug] })
    },
  })
}

export function useUpdateDepartment(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      departmentId,
      data,
    }: {
      departmentId: string
      data: { name?: string; description?: string; icon?: string; color?: string; managerId?: string }
    }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceSlug}/departments/${departmentId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-departments", workspaceSlug] })
    },
  })
}

export function useDeleteDepartment(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (departmentId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceSlug}/departments/${departmentId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-departments", workspaceSlug] })
    },
  })
}

export function useWorkspaceTeams(workspaceSlug: string, departmentId?: string) {
  return useQuery({
    queryKey: ["workspace-teams", workspaceSlug, departmentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/teams`, { params: { departmentId } })
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useCreateTeam(workspaceSlug: string) {
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
      const { data: response } = await apiClient.post(`/workspaces/${workspaceSlug}/teams`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-teams", workspaceSlug] })
    },
  })
}

export function useWorkspaceApiTokens(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspace-api-tokens", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/api-tokens`)
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useCreateWorkspaceApiToken(workspaceSlug: string) {
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
      const { data: response } = await apiClient.post(`/workspaces/${workspaceSlug}/api-tokens`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-api-tokens", workspaceSlug] })
    },
  })
}

export function useWorkspaceChannels(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspace-channels", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/channels`)
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useCreateWorkspaceChannel(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      type?: "public" | "private"
      departmentId?: string
      icon?: string
    }) => {
      const { data: response } = await apiClient.post(`/workspaces/${workspaceSlug}/channels`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-channels", workspaceSlug] })
    },
  })
}

export function useUpdateWorkspaceChannel(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channelId,
      data,
    }: {
      channelId: string
      data: { name?: string; description?: string; type?: "public" | "private"; icon?: string }
    }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceSlug}/channels/${channelId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-channels", workspaceSlug] })
    },
  })
}

export function useDeleteWorkspaceChannel(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (channelId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceSlug}/channels/${channelId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-channels", workspaceSlug] })
    },
  })
}

export function useWorkspaceProjects(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspace-projects", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/projects`)
      return data
    },
    enabled: !!workspaceSlug,
  })
}

export function useCreateWorkspaceProject(workspaceSlug: string) {
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
      const { data: response } = await apiClient.post(`/workspaces/${workspaceSlug}/projects`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-projects", workspaceSlug] })
    },
  })
}

export function useUpdateWorkspaceProject(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string
      data: { name?: string; description?: string; icon?: string; status?: string; priority?: string; endDate?: string }
    }) => {
      const { data: response } = await apiClient.patch(`/workspaces/${workspaceSlug}/projects/${projectId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-projects", workspaceSlug] })
    },
  })
}

export function useDeleteWorkspaceProject(workspaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await apiClient.delete(`/workspaces/${workspaceSlug}/projects/${projectId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-projects", workspaceSlug] })
    },
  })
}
