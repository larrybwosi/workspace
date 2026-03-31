import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Message } from '@/lib/types';

export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (channelId: string, workspaceId?: string, threadId?: string) =>
    workspaceId ? ['workspaces', workspaceId, 'channels', channelId, 'messages', { threadId }] : [...messageKeys.lists(), channelId, { threadId }] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
};

// Fetch messages with infinite scroll
export function useMessages(
  channelId: string,
  workspaceId?: string,
  threadId?: string,
  contextId?: string,
  isV2?: boolean
) {
  return useInfiniteQuery({
    queryKey: messageKeys.list(channelId, workspaceId, threadId || contextId),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      // Determine version prefix: default to V1 but use V2 if requested (e.g. widget)
      const prefix = isV2 ? "/v2" : "";

      let url = "";
      if (isV2 && workspaceId) {
        // Use V2 workspace-scoped path
        url = `${prefix}/workspaces/${workspaceId}/messages`;
      } else {
        url = workspaceId
          ? `/workspaces/${workspaceId}/channels/${channelId}/messages`
          : `/channels/${channelId}/messages`;
      }

      const { data } = await apiClient.get<{ messages: Message[]; nextCursor: string | null }>(url, {
        params: { cursor: pageParam, limit: 50, threadId, contextId, channelId },
      });
      return data;
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    enabled: !!channelId,
    initialPageParam: undefined,
  });
}

// Send message
export function useSendMessage(workspaceId?: string, isV2?: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      ...message
    }: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'userId'> & {
      channelId: string;
      threadId?: string;
      contextId?: string;
    }) => {
      const prefix = isV2 ? "/v2" : "";

      let url = "";
      if (isV2 && workspaceId) {
        url = `${prefix}/workspaces/${workspaceId}/messages`;
      } else {
        url = workspaceId
          ? `/workspaces/${workspaceId}/channels/${channelId}/messages`
          : `/channels/${channelId}/messages`;
      }
      const { data } = await apiClient.post<Message>(url, { ...message, channelId });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(variables.channelId, workspaceId, variables.threadId) });
    },
  });
}

// Update message
export function useUpdateMessage(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, channelId, ...updates }: Partial<Message> & { id: string; channelId: string }) => {
      const url = workspaceId
        ? `/workspaces/${workspaceId}/channels/${channelId}/messages/${id}`
        : `/channels/${channelId}/messages/${id}`;
      const { data } = await apiClient.patch<Message>(url, updates);
      return { data, channelId };
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceId) });
    },
  });
}

// Delete message
export function useDeleteMessage(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, channelId }: { id: string; channelId: string }) => {
      const url = workspaceId
        ? `/workspaces/${workspaceId}/channels/${channelId}/messages/${id}`
        : `/channels/${channelId}/messages/${id}`;
      await apiClient.delete(url);
      return { id, channelId };
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceId) });
    },
  });
}

// Reply to message
export function useReplyToMessage(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      channelId,
      ...reply
    }: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'userId'> & { messageId: string; channelId: string }) => {
      const url = workspaceId
        ? `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/replies`
        : `/channels/${channelId}/messages/${messageId}/reply`;
      const { data } = await apiClient.post<Message>(url, reply);
      return { data, channelId };
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceId) });
    },
  });
}

// Mark messages as read mutation (Batch)
export function useMarkMessagesAsRead(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageIds, channelId }: { messageIds: string[]; channelId: string }) => {
      const url = workspaceId
        ? `/workspaces/${workspaceId}/channels/${channelId}/messages/read`
        : `/channels/${channelId}/messages/read`;
      const { data } = await apiClient.post(url, { messageIds });
      return { data, channelId };
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceId) });
    },
  });
}

export const dmKeys = {
  all: ['dms'] as const,
  lists: () => [...dmKeys.all, 'list'] as const,
  list: (dmId: string) => [...dmKeys.lists(), dmId] as const,
  conversations: () => [...dmKeys.all, 'conversations'] as const,
};

// Fetch all DM conversations
export function useDMConversations() {
  return useQuery({
    queryKey: dmKeys.conversations(),
    queryFn: async () => {
      const { data } = await apiClient.get('/dms');
      return data;
    },
  });
}

// Create or get DM
export function useCreateDM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.post('/dms', { userId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmKeys.conversations() });
    },
  });
}

// Fetch DM messages with pagination
export function useDMMessages(dmId: string) {
  return useInfiniteQuery({
    queryKey: dmKeys.list(dmId),
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get(`/dms/${dmId}/messages`, {
        params: { cursor: pageParam, limit: 50 },
      });
      return data;
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    enabled: !!dmId,
    initialPageParam: undefined,
  });
}

// Send DM message
export function useSendDMMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dmId,
      content,
      replyToId,
      attachments,
    }: {
      dmId: string;
      content: string;
      replyToId?: string;
      attachments?: any[];
    }) => {
      const { data } = await apiClient.post(`/dms/${dmId}/messages`, {
        content,
        replyToId,
        attachments,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dmKeys.list(variables.dmId) });
      queryClient.invalidateQueries({ queryKey: dmKeys.conversations() });
    },
  });
}
