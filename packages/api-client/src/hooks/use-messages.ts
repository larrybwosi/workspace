import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Message } from '@repo/types';

export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (channelId: string, workspaceSlug?: string, threadId?: string) =>
    workspaceSlug ? ['workspaces', workspaceSlug, 'channels', channelId, 'messages', { threadId }] : [...messageKeys.lists(), channelId, { threadId }] as const,
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
      const prefix = isV2 ? "/v2" : "";

      const url = isV2 && workspaceSlug
        ? `${prefix}/workspaces/${workspaceSlug}/messages`
        : workspaceSlug
          ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages`
          : `/channels/${channelId}/messages`;

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
export function useSendMessage(workspaceSlug?: string, isV2?: boolean) {
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

      const url = isV2 && workspaceSlug
        ? `${prefix}/workspaces/${workspaceSlug}/messages`
        : workspaceSlug
          ? `/workspaces/${workspaceSlug}/channels/${channelId}/messages`
          : `/channels/${channelId}/messages`;
      const { data } = await apiClient.post<Message>(url, { ...message, channelId });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(variables.channelId, workspaceSlug, variables.threadId) });
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
const readTimeout: { [channelId: string]: ReturnType<typeof setTimeout> } = {};
const readResolvers: { [channelId: string]: { resolve: (value: { channelId: string; messageIds: string[] }) => void; reject: (reason: unknown) => void }[] } = {};

export function useMarkMessagesAsRead(workspaceSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageIds, channelId }: { messageIds: string[]; channelId: string }): Promise<{ channelId: string; messageIds: string[] }> => {
      // Buffer messages to be marked as read
      if (!readBuffer[channelId]) readBuffer[channelId] = new Set();
      messageIds.forEach(id => readBuffer[channelId].add(id));

      if (!readResolvers[channelId]) readResolvers[channelId] = [];

      return new Promise<{ channelId: string; messageIds: string[] }>((resolve, reject) => {
        readResolvers[channelId].push({ resolve, reject });

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
    onSuccess: (data: { channelId: string; messageIds: string[] }) => {
      // Optimistically update query data to mark messages as read in the UI
      const { channelId, messageIds } = data;
      const queryKey = workspaceSlug
        ? ['workspaces', workspaceSlug, 'channels', channelId, 'messages']
        : messageKeys.list(channelId);

      queryClient.setQueriesData({ queryKey }, (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object' || !('pages' in oldData)) return oldData;
        const typedOldData = oldData as { pages: { messages: Message[] }[] };
        return {
          ...typedOldData,
          pages: typedOldData.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              messageIds.includes(m.id) ? { ...m, readByCurrentUser: true } : m
            ),
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
      attachments?: unknown[];
    }) => {
      const { data } = await apiClient.post<Message>(`/dms/${dmId}/messages`, {
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
