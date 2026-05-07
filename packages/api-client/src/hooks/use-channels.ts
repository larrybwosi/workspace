import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Channel } from '@repo/types';

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
export function useChannel(id: string, workspaceSlug?: string) {
  return useQuery({
    queryKey: workspaceSlug ? ['workspaces', workspaceSlug, 'channels', id] : channelKeys.detail(id),
    queryFn: async () => {
      const url = workspaceSlug ? `/workspaces/${workspaceSlug}/channels/${id}` : `/channels/${id}`;
      const { data } = await apiClient.get<Channel>(url);
      return data;
    },
    enabled: !!id,
  });
}

// Create channel
export function useCreateChannel(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newChannel: any) => {
      const url = workspaceSlug ? `/workspaces/${workspaceSlug}/channels` : '/channels';
      const { data } = await apiClient.post<Channel>(url, newChannel);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceSlug) {
        queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceSlug] });
      }
    },
  });
}

// Update channel
export function useUpdateChannel(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Channel> & { id: string }) => {
      const url = workspaceSlug ? `/workspaces/${workspaceSlug}/channels/${id}` : `/channels/${id}`;
      const { data } = await apiClient.patch<Channel>(url, updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceSlug) {
        queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceSlug] });
        queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceSlug, 'channels', data.id] });
      }
    },
  });
}

// Delete channel
export function useDeleteChannel(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = workspaceSlug ? `/workspaces/${workspaceSlug}/channels/${id}` : `/channels/${id}`;
      await apiClient.delete(url);
      return id;
    },
    onSuccess: id => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceSlug) {
        queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceSlug] });
      }
    },
  });
}

// Join channel
export function useJoinChannel(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const url = workspaceSlug ? `/workspaces/${workspaceSlug}/channels/${channelId}/join` : `/channels/${channelId}/join`;
      const { data } = await apiClient.post(url);
      return data;
    },
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceSlug) {
        queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceSlug, 'channels', channelId] });
      }
    },
  });
}

// Leave channel
export function useLeaveChannel(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const url = workspaceSlug
        ? `/workspaces/${workspaceSlug}/channels/${channelId}/leave`
        : `/channels/${channelId}/leave`;
      await apiClient.post(url);
      return channelId;
    },
    onSuccess: channelId => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      if (workspaceSlug) {
        queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceSlug, 'channels', channelId] });
      }
    },
  });
}
