"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../client"

export function useEligibleAssets() {
  return useQuery({
    queryKey: ["assets", "eligible"],
    queryFn: async () => {
      const { data } = await apiClient.get("/assets/eligible")
      return data
    },
  })
}
