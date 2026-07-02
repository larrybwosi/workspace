import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';

export type WorkspaceSearchType = 'all' | 'messages' | 'channels' | 'members' | 'files';

export interface SearchChannelResult {
  id: string;
  name: string;
  slug: string | null;
  icon: string;
  type: string;
  isPrivate: boolean;
  description: string | null;
}

export interface SearchMemberResult {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  status: string | null;
  role: string | null;
}

export interface SearchMessageResult {
  id: string;
  content: string;
  timestamp: string;
  channelId: string;
  threadId: string | null;
  user: { id: string; name: string | null; avatar: string | null };
  channel: { id: string; name: string; slug: string | null };
}

export interface SearchFileResult {
  id: string;
  name: string;
  type: string;
  url: string;
  size: string | null;
  createdAt: string;
  message: {
    id: string;
    channelId: string;
    channel: { id: string; name: string; slug: string | null };
  } | null;
}

export interface WorkspaceSearchResults {
  channels: SearchChannelResult[];
  members: SearchMemberResult[];
  messages: SearchMessageResult[];
  files: SearchFileResult[];
}

export interface WorkspaceSearchResponse {
  query: string;
  results: WorkspaceSearchResults;
}

export const searchKeys = {
  all: ['search'] as const,
  workspace: (slug: string, query: string, type: WorkspaceSearchType) =>
    [...searchKeys.all, slug, type, query] as const,
};

const EMPTY_RESULTS: WorkspaceSearchResults = { channels: [], members: [], messages: [], files: [] };

/**
 * Unified, session-authenticated workspace search that powers the command palette.
 * Scoped to a single workspace slug and to channels the current user can access.
 */
export function useWorkspaceSearch(
  slug: string | undefined,
  query: string,
  options?: { type?: WorkspaceSearchType; limit?: number; enabled?: boolean }
) {
  const type = options?.type ?? 'all';
  const trimmed = query.trim();

  return useQuery({
    queryKey: searchKeys.workspace(slug ?? '', trimmed, type),
    queryFn: async () => {
      const { data } = await apiClient.get<WorkspaceSearchResponse>(`/workspaces/${slug}/search`, {
        params: { q: trimmed, type, limit: options?.limit ?? 8 },
      });
      return data.results ?? EMPTY_RESULTS;
    },
    enabled: Boolean(slug) && trimmed.length >= 1 && (options?.enabled ?? true),
    placeholderData: previous => previous,
    staleTime: 15_000,
  });
}
