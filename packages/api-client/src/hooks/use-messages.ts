import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Message } from '@repo/types';

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
    queryFn: async ({ pageParam }: { pageParam: any }) => {
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
    onMutate: async (newMessage) => {
      const queryKey = messageKeys.list(newMessage.channelId, workspaceId, newMessage.threadId);
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData(queryKey);
      const currentUser = queryClient.getQueryData(['users', 'current']) as any;

      const tempId = `temp-${Math.random().toString(36).substring(2, 11)}`;
      const optimisticMessage: Message = {
        id: tempId,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'me',
        reactions: [],
        ...newMessage,
        status: 'sending' as any,
        user: currentUser,
      } as any;

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages) return {
          pages: [{ messages: [optimisticMessage], nextCursor: null }],
          pageParams: [undefined],
        };

        const newPages = [...old.pages];
        const lastPageIndex = newPages.length - 1;
        newPages[lastPageIndex] = {
          ...newPages[lastPageIndex],
          messages: [...newPages[lastPageIndex].messages, optimisticMessage],
        };

        return {
          ...old,
          pages: newPages,
        };
      });

      return { previousMessages, queryKey, tempId };
    },
    onError: (err, newMessage, context: any) => {
      if (context?.queryKey && context.tempId) {
        queryClient.setQueryData(context.queryKey, (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              messages: page.messages.map((m: any) =>
                m.id === context.tempId ? { ...m, status: 'error' } : m
              ),
            })),
          };
        });
      }
    },
    onSuccess: (data, variables, context) => {
      const queryKey = messageKeys.list(variables.channelId, workspaceId, variables.threadId);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: any) =>
              m.id === context.tempId ? data : m
            ),
          })),
        };
      });
    },
    onSettled: (data, error, variables) => {
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
    onMutate: async (newReply) => {
      const queryKey = messageKeys.list(newReply.channelId, workspaceId);
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData(queryKey);
      const currentUser = queryClient.getQueryData(['users', 'current']) as any;

      const tempId = `temp-${Math.random().toString(36).substring(2, 11)}`;
      const optimisticReply: Message = {
        id: tempId,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'me',
        reactions: [],
        ...newReply,
        replyTo: newReply.messageId,
        status: 'sending' as any,
        user: currentUser,
      } as any;

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages) return {
          pages: [{ messages: [optimisticReply], nextCursor: null }],
          pageParams: [undefined],
        };

        const newPages = [...old.pages];
        const lastPageIndex = newPages.length - 1;
        newPages[lastPageIndex] = {
          ...newPages[lastPageIndex],
          messages: [...newPages[lastPageIndex].messages, optimisticReply],
        };

        return {
          ...old,
          pages: newPages,
        };
      });

      return { previousMessages, queryKey, tempId };
    },
    onError: (err, newReply, context: any) => {
      if (context?.queryKey && context.tempId) {
        queryClient.setQueryData(context.queryKey, (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              messages: page.messages.map((m: any) =>
                m.id === context.tempId ? { ...m, status: 'error' } : m
              ),
            })),
          };
        });
      }
    },
    onSuccess: (data, variables, context) => {
      const { channelId } = data as any;
      const queryKey = messageKeys.list(variables.channelId, workspaceId);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: any) =>
              m.id === context.tempId ? (data as any).data || data : m
            ),
          })),
        };
      });
    },
    onSettled: (data) => {
      const channelId = (data as any)?.channelId || (data as any)?.data?.channelId;
      if (channelId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(channelId, workspaceId) });
      }
    },
  });
}

// Mark messages as read mutation (Batch)
// We use a simple debounce/buffer mechanism to avoid excessive API calls
const readBuffer: { [channelId: string]: Set<string> } = {};
const readTimeout: { [channelId: string]: any } = {};
const readResolvers: { [channelId: string]: { resolve: (value: any) => void; reject: (reason: any) => void }[] } = {};

export function useMarkMessagesAsRead(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageIds, channelId }: { messageIds: string[]; channelId: string }) => {
      // Buffer messages to be marked as read
      if (!readBuffer[channelId]) readBuffer[channelId] = new Set();
      messageIds.forEach(id => readBuffer[channelId].add(id));

      if (!readResolvers[channelId]) readResolvers[channelId] = [];

      return new Promise((resolve, reject) => {
        readResolvers[channelId].push({ resolve, reject });

        if (readTimeout[channelId]) clearTimeout(readTimeout[channelId]);

        readTimeout[channelId] = setTimeout(async () => {
          const idsToMark = Array.from(readBuffer[channelId]);
          const resolvers = [...readResolvers[channelId]];

          readBuffer[channelId].clear();
          readResolvers[channelId] = [];

          try {
            const url = workspaceId
              ? `/workspaces/${workspaceId}/channels/${channelId}/messages/read`
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
    onSuccess: (data: any) => {
      // Optimistically update query data to mark messages as read in the UI
      const { channelId, messageIds } = data;
      const queryKey = workspaceId
        ? ['workspaces', workspaceId, 'channels', channelId, 'messages']
        : messageKeys.list(channelId);

      queryClient.setQueriesData({ queryKey }, (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: any) =>
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
