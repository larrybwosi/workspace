import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Channel } from '@/lib/types';

// Query keys for cache management
export const channelKeys = {
  all: ['channels'] as const,
  lists: () => [...channelKeys.all, 'list'] as const,
  list: (filters: string) => [...channelKeys.lists(), { filters }] as const,
  details: () => [...channelKeys.all, 'detail'] as const,
  detail: (id: string) => [...channelKeys.details(), id] as const,
};

// Fetch all channels
export function useChannels() {
  return useQuery({
    queryKey: channelKeys.lists(),
    queryFn: async () => {
      const { data } = await apiClient.get<Channel[]>('/channels');
      return data;
    },
  });
}

// Fetch single channel
export function useChannel(id: string, workspaceId?: string) {
  return useQuery({
    queryKey: workspaceId ? ['workspaces', workspaceId, 'channels', id] : channelKeys.detail(id),
    queryFn: async () => {
      const url = workspaceId ? `/workspaces/${workspaceId}/channels/${id}` : `/channels/${id}`;
      const { data } = await apiClient.get<Channel>(url);
      return data;
    },
    enabled: !!id,
  });
}

// Create channel
export function useCreateChannel(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newChannel: any) => {
      const url = workspaceId ? `/workspaces/${workspaceId}/channels` : '/channels';
      const { data } = await apiClient.post<Channel>(url, newChannel);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
      }
    },
  });
}

// Update channel
export function useUpdateChannel(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Channel> & { id: string }) => {
      const url = workspaceId ? `/workspaces/${workspaceId}/channels/${id}` : `/channels/${id}`;
      const { data } = await apiClient.patch<Channel>(url, updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'channels', data.id] });
      }
    },
  });
}

// Delete channel
export function useDeleteChannel(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = workspaceId ? `/workspaces/${workspaceId}/channels/${id}` : `/channels/${id}`;
      await apiClient.delete(url);
      return id;
    },
    onSuccess: id => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
      }
    },
  });
}

// Join channel
export function useJoinChannel(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const url = workspaceId ? `/workspaces/${workspaceId}/channels/${channelId}/join` : `/channels/${channelId}/join`;
      const { data } = await apiClient.post(url);
      return data;
    },
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'channels', channelId] });
      }
    },
  });
}

// Leave channel
export function useLeaveChannel(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const url = workspaceId
        ? `/workspaces/${workspaceId}/channels/${channelId}/leave`
        : `/channels/${channelId}/leave`;
      await apiClient.post(url);
      return channelId;
    },
    onSuccess: channelId => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'channels', channelId] });
      }
    },
  });
}
