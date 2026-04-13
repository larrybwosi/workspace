import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../client"

export function useUserSearch(query: string, friendsOnly = false) {
  return useQuery({
    queryKey: ["user-search", query, friendsOnly],
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return { users: [] }
      }

      const { data } = await apiClient.get("/users/search", {
        params: {
          query: query.trim(),
          friendsOnly,
        },
      })
      return data
    },
    enabled: query.trim().length > 0,
  })
}
