import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../client"
import { useEffect } from "react"
import { getAblyClient, AblyChannels } from "@repo/shared"

export function useActiveCalls(workspaceSlug: string, workspaceId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!workspaceId) return

    const ably = getAblyClient()
    if (!ably) return

    const channel = ably.channels.get(AblyChannels.workspace(workspaceId))

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["active-calls", workspaceSlug] })
    }

    channel.subscribe("call-started", handleUpdate)
    channel.subscribe("call-ended", handleUpdate)
    channel.subscribe("call-joined", handleUpdate)
    channel.subscribe("call-left", handleUpdate)

    return () => {
      channel.unsubscribe("call-started", handleUpdate)
      channel.unsubscribe("call-ended", handleUpdate)
      channel.unsubscribe("call-joined", handleUpdate)
      channel.unsubscribe("call-left", handleUpdate)
    }
  }, [workspaceId, workspaceSlug, queryClient])

  return useQuery({
    queryKey: ["active-calls", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceSlug}/calls/active`)
      return data.calls || []
    },
    enabled: !!workspaceSlug,
  })
}

export function useScheduledCalls(workspaceSlug: string, workspaceId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!workspaceId) return

    const ably = getAblyClient()
    if (!ably) return

    const channel = ably.channels.get(AblyChannels.workspace(workspaceId))

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-calls", workspaceSlug] })
    }

    channel.subscribe("call-scheduled", handleUpdate)

    return () => {
      channel.unsubscribe("call-scheduled", handleUpdate)
    }
  }, [workspaceId, workspaceSlug, queryClient])

  return useQuery({
    queryKey: ["scheduled-calls", workspaceSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/calls/scheduled`, {
        params: { workspaceSlug }
      })
      return data || []
    },
    enabled: !!workspaceSlug,
  })
}

export function useStartCall() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      type: "voice" | "video"
      workspaceSlug: string
      channelId?: string
      recipientId?: string
      notifyAll?: boolean
    }) => {
      const { data } = await apiClient.post("/calls", params)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["active-calls", variables.workspaceSlug] })
    }
  })
}

export function useJoinCall() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      type: string
      callId: string
      workspaceSlug: string
    }) => {
      const { data } = await apiClient.post("/calls", params)

      if (!data.token) {
        const { data: tokenData } = await apiClient.post("/agora/token", {
          channelName: data.channelName,
          uid: data.uid,
        })
        data.token = tokenData.token
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["active-calls", variables.workspaceSlug] })
    }
  })
}

export function useScheduleCall() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      title: string
      description?: string
      type: string
      scheduledFor: string
      workspaceSlug: string
      channelId?: string
    }) => {
      const { data } = await apiClient.post("/calls/scheduled", params)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-calls", variables.workspaceSlug] })
    }
  })
}
