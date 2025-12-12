import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces")
      if (!res.ok) throw new Error("Failed to fetch workspaces")
      return res.json()
    },
  })
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`)
      if (!res.ok) throw new Error("Failed to fetch workspace")
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; icon?: string; description?: string }) => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create workspace")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update workspace")
      return res.json()
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
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send invitation")
      }

      return response.json()
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
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`)
      if (!response.ok) throw new Error("Failed to fetch invitations")
      const data = await response.json()
      return data.invitations
    },
  })
}

export function useAcceptWorkspaceInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to accept invitation")
      }

      return response.json()
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
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to decline invitation")
      }

      return response.json()
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
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to cancel invitation")
      }

      return response.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/analytics?range=${range}`)
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`)
      if (!res.ok) throw new Error("Failed to fetch members")
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useUpdateWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error("Failed to update member")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove member")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete workspace")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/audit-logs?page=${page}&limit=${limit}`)
      if (!res.ok) throw new Error("Failed to fetch audit logs")
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useWorkspaceIntegrations(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-integrations", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations`)
      if (!res.ok) throw new Error("Failed to fetch integrations")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create integration")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/${integrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update integration")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/${integrationId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete integration")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-integrations", workspaceId] })
    },
  })
}

export function useTestWorkspaceIntegration(workspaceId: string) {
  return useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/${integrationId}/test`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to test integration")
      return res.json()
    },
  })
}

export function useWorkspaceDepartments(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-departments", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/departments`)
      if (!res.ok) throw new Error("Failed to fetch departments")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create department")
      return res.json()
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
      const url = departmentId
        ? `/api/workspaces/${workspaceId}/teams?departmentId=${departmentId}`
        : `/api/workspaces/${workspaceId}/teams`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch teams")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create team")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/api-tokens`)
      if (!res.ok) throw new Error("Failed to fetch API tokens")
      return res.json()
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
      const res = await fetch(`/api/workspaces/${workspaceId}/api-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create API token")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-api-tokens", workspaceId] })
    },
  })
}
