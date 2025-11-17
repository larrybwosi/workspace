import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useIntegrationStats() {
  return useQuery({
    queryKey: ["integration-stats"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })
}

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/api-keys")
      if (!res.ok) throw new Error("Failed to fetch API keys")
      return res.json()
    },
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      name: string
      permissions: string[]
      rateLimit: number
      expiresInDays: number
    }) => {
      const res = await fetch("/api/integrations/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create API key")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      queryClient.invalidateQueries({ queryKey: ["integration-stats"] })
    },
  })
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ keyId, ...data }: { keyId: string; isActive: boolean }) => {
      const res = await fetch(`/api/integrations/api-keys/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update API key")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
    },
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(`/api/integrations/api-keys/${keyId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete API key")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      queryClient.invalidateQueries({ queryKey: ["integration-stats"] })
    },
  })
}

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/webhooks")
      if (!res.ok) throw new Error("Failed to fetch webhooks")
      return res.json()
    },
  })
}

export function useCreateWebhook() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      name: string
      url: string
      events: string[]
    }) => {
      const res = await fetch("/api/integrations/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create webhook")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
      queryClient.invalidateQueries({ queryKey: ["integration-stats"] })
    },
  })
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ webhookId, ...data }: { webhookId: string; isActive: boolean }) => {
      const res = await fetch(`/api/integrations/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update webhook")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
    },
  })
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (webhookId: string) => {
      const res = await fetch(`/api/integrations/webhooks/${webhookId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete webhook")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
      queryClient.invalidateQueries({ queryKey: ["integration-stats"] })
    },
  })
}

export function useWebhookLogs(webhookId: string) {
  return useQuery({
    queryKey: ["webhook-logs", webhookId],
    queryFn: async () => {
      const res = await fetch(`/api/integrations/webhooks/${webhookId}/logs`)
      if (!res.ok) throw new Error("Failed to fetch webhook logs")
      return res.json()
    },
    enabled: !!webhookId,
  })
}
