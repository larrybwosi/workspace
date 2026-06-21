import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Message } from '@repo/types';

export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (channelId: string, workspaceSlug?: string, threadId?: string) =>
    workspaceSlug
      ? ['workspaces', workspaceSlug, 'channels', channelId, 'messages', { threadId }]
      : ([...messageKeys.lists(), channelId, { threadId }] as const),
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
};

// Fetch messages with infinite scroll
export function useMessages(
  channelId: string,
  workspaceSlug?: string,
  threadId?: string,
  contextId?: string,
  isV2?: boolean
) {
  return useInfiniteQuery({
    queryKey: messageKeys.list(channelId, workspaceSlug, threadId || contextId),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      // Determine version prefix: default to V1 but use V2 if requested (e.g. widget)
      const prefix = isV2 ? '/v2' : '';

      let url;
      if (isV2 && workspaceSlug) {
        // Use V2 workspace-scoped path
        url = `${prefix}/workspaces/${workspaceSlug}/messages`;
      } else {
        url = workspaceSlug
          ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages`
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

type SendMessageVariables = Omit<Message, 'id' | 'timestamp' | 'reactions' | 'userId'> & {
  channelId: string;
  threadId?: string;
  contextId?: string;
  messageType?: string;
  attachments?: unknown[];
};

// Send message
export function useSendMessage(workspaceSlug?: string, isV2?: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channelId, ...message }: SendMessageVariables) => {
      const prefix = isV2 ? '/v2' : '';

      let url;
      if (isV2 && workspaceSlug) {
        url = `${prefix}/workspaces/${workspaceSlug}/messages`;
      } else {
        url = workspaceSlug
          ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages`
          : `/channels/${channelId}/messages`;
      }
      const { data } = await apiClient.post<Message>(url, { ...message, channelId });
      return data;
    },
    onSuccess: (_: Message, variables: SendMessageVariables) => {
      queryClient.invalidateQueries({
        queryKey: messageKeys.list(variables.channelId, workspaceSlug, variables.threadId),
      });
    },
  });
}

// Update message
export function useUpdateMessage(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, channelId, ...updates }: Partial<Message> & { id: string; channelId: string }) => {
      const url = workspaceSlug
        ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages/${id}`
        : `/channels/${channelId}/messages/${id}`;
      const { data } = await apiClient.patch<Message>(url, updates);
      return { data, channelId };
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceSlug) });
    },
  });
}

// Delete message
export function useDeleteMessage(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, channelId }: { id: string; channelId: string }) => {
      const url = workspaceSlug
        ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages/${id}`
        : `/channels/${channelId}/messages/${id}`;
      await apiClient.delete(url);
      return { id, channelId };
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceSlug) });
    },
  });
}

// Reply to message
export function useTriggerAction(workspaceSlug?: string) {
  return useMutation({
    mutationFn: async ({
      messageId,
      actionId,
      payload,
      formState,
    }: {
      messageId: string;
      actionId: string;
      payload?: Record<string, unknown>;
      formState?: Record<string, unknown>;
    }) => {
      // Always use V2 endpoint for actions as it supports M2M callbacks
      const url = `/v2/workspaces/${workspaceSlug}/messages/${messageId}/actions/${actionId}`;
      const { data } = await apiClient.post(url, { payload, formState });
      return { data, messageId };
    },
    onSuccess: () => {
      // We don't necessarily know which channel this message belongs to here,
      // but Ably should handle the real-time update anyway.
      // If we want to be sure, we'd need to invalidate all message lists or pass channelId.
    },
  });
}

export function useReplyToMessage(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      channelId,
      ...reply
    }: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'userId'> & { messageId: string; channelId: string }) => {
      const url = workspaceSlug
        ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages/${messageId}/replies`
        : `/channels/${channelId}/messages/${messageId}/reply`;
      const { data } = await apiClient.post<Message>(url, reply);
      return { data, channelId };
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceSlug) });
    },
  });
}

// Mark messages as read mutation (Batch)
// We use a simple debounce/buffer mechanism to avoid excessive API calls
const readBuffer: { [channelId: string]: Set<string> } = {};
const readTimeout: { [channelId: string]: NodeJS.Timeout | undefined } = {};
const readResolvers: {
  [channelId: string]: { resolve: (value: unknown) => void; reject: (reason: unknown) => void }[];
} = {};

export function useMarkMessagesAsRead(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageIds,
      channelId,
    }: {
      messageIds: string[];
      channelId: string;
    }): Promise<Record<string, unknown>> => {
      // Buffer messages to be marked as read
      if (!readBuffer[channelId]) readBuffer[channelId] = new Set();
      messageIds.forEach(id => readBuffer[channelId].add(id));

      if (!readResolvers[channelId]) readResolvers[channelId] = [];

      return new Promise((resolve, reject) => {
        readResolvers[channelId].push({
          resolve: resolve as (value: unknown) => void,
          reject: reject as (reason: unknown) => void,
        });

        if (readTimeout[channelId]) clearTimeout(readTimeout[channelId]);

        readTimeout[channelId] = setTimeout(async () => {
          const idsToMark = Array.from(readBuffer[channelId]);
          const resolvers = [...readResolvers[channelId]];

          readBuffer[channelId].clear();
          readResolvers[channelId] = [];

          try {
            const url = workspaceSlug
              ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages/read`
              : `/channels/${channelId}/messages/read`;
            const { data } = await apiClient.post(url, { messageIds: idsToMark });
            const result = { data, channelId, messageIds: idsToMark };
            resolvers.forEach(res => res.resolve(result));
          } catch (error) {
            resolvers.forEach(res => res.reject(error));
          }
        }, 1000); // 1 second buffer
      });
    },
    onSuccess: (data: unknown) => {
      // Optimistically update query data to mark messages as read in the UI
      const typedData = data as { channelId: string; messageIds: string[] };
      const { channelId, messageIds } = typedData;
      const queryKey = workspaceSlug
        ? ['workspaces', workspaceSlug, 'channels', channelId, 'messages']
        : messageKeys.list(channelId);

      queryClient.setQueriesData({ queryKey }, (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object' || !('pages' in oldData)) return oldData;
        const dataObj = oldData as { pages: { messages: Message[] }[] };
        return {
          ...dataObj,
          pages: dataObj.pages.map(page => ({
            ...page,
            messages: page.messages.map(m => (messageIds.includes(m.id) ? { ...m, readByCurrentUser: true } : m)),
          })),
        };
      });
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
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
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

type SendDMMessageVariables = {
  dmId: string;
  content: string;
  replyToId?: string;
  attachments?: unknown[];
};

// Send DM message
export function useSendDMMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dmId, content, replyToId, attachments }: SendDMMessageVariables) => {
      const { data } = await apiClient.post<Message>(`/dms/${dmId}/messages`, {
        content,
        replyToId,
        attachments,
      });
      return data;
    },
    onSuccess: (_: Message, variables: SendDMMessageVariables) => {
      queryClient.invalidateQueries({ queryKey: dmKeys.list(variables.dmId) });
      queryClient.invalidateQueries({ queryKey: dmKeys.conversations() });
    },
  });
}
