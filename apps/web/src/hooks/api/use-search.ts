import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { SearchResult } from "@/lib/types"

export const searchKeys = {
  all: ["search"] as const,
  results: (query: string) => [...searchKeys.all, query] as const,
}

// Search across all content
export function useSearch(query: string) {
  return useQuery({
    queryKey: searchKeys.results(query),
    queryFn: async () => {
      const { data } = await apiClient.get<SearchResult[]>("/search", {
        params: { q: query },
      })
      return data
    },
    enabled: query.length > 2, // Only search if query is longer than 2 characters
  })
}

// Search with filters
export function useAdvancedSearch(
  query: string,
  filters: {
    type?: "message" | "file" | "thread"
    channel?: string
    dateFrom?: Date
    dateTo?: Date
  },
) {
  return useQuery({
    queryKey: [...searchKeys.results(query), filters],
    queryFn: async () => {
      const { data } = await apiClient.get<SearchResult[]>("/search/advanced", {
        params: { q: query, ...filters },
      })
      return data
    },
    enabled: query.length > 2,
  })
}
