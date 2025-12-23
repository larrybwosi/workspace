import { useQuery } from "@tanstack/react-query"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

export function useUserSearch(query: string, friendsOnly = false) {
  return useQuery({
    queryKey: ["user-search", query, friendsOnly],
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return { users: [] }
      }

      const { data } = await axios.get(`${API_URL}/api/users/search`, {
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
