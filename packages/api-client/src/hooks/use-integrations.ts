import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export function useIntegrationStats() {
  return useQuery({
    queryKey: ['integration-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/integrations/stats');
      return res.data;
    },
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await apiClient.get('/integrations/api-keys');
      return res.data;
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; permissions: string[]; rateLimit: number; expiresInDays: number }) => {
      const res = await apiClient.post('/integrations/api-keys', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['integration-stats'] });
    },
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keyId, ...data }: { keyId: string; isActive: boolean }) => {
      const res = await apiClient.patch(`/integrations/api-keys/${keyId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiClient.delete(`/integrations/api-keys/${keyId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['integration-stats'] });
    },
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const res = await apiClient.get('/integrations/webhooks');
      return res.data;
    },
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; url: string; events: string[] }) => {
      const res = await apiClient.post('/integrations/webhooks', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      queryClient.invalidateQueries({ queryKey: ['integration-stats'] });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ webhookId, ...data }: { webhookId: string; isActive: boolean }) => {
      const res = await apiClient.patch(`/integrations/webhooks/${webhookId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const res = await apiClient.delete(`/integrations/webhooks/${webhookId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      queryClient.invalidateQueries({ queryKey: ['integration-stats'] });
    },
  });
}

export function useWebhookLogs(webhookId: string) {
  return useQuery({
    queryKey: ['webhook-logs', webhookId],
    queryFn: async () => {
      const res = await apiClient.get(`/integrations/webhooks/${webhookId}/logs`);
      return res.data;
    },
    enabled: !!webhookId,
  });
}
