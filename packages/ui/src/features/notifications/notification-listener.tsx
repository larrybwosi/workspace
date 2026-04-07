"use client"

import * as React from "react"
import { useEffect, useCallback } from "react"
import { getAblyClient, AblyChannels, AblyEvents } from "@repo/shared"
import { useParams, usePathname } from "next/navigation"
import { showDiscordNotification, playNotificationSound } from "./custom-toasts/notification-utils"
import { useSession } from "../../lib/auth/auth-client"

export function NotificationListener() {
  const { data: session } = useSession() as any
  const params = useParams()
  const pathname = usePathname()

  // Track "active" context to suppress notifications
  // Format depends on how the app is structured (e.g., workspaceSlug, channelSlug)
  const activeWorkspace = params.slug as string
  const activeChannel = params.channelId as string || params.channelSlug as string

  const handleNotification = useCallback((message: any) => {
    const notification = message.data

    // Suppression Logic:
    // If the notification is for a channel the user is currently in, don't show it.
    if (notification.entityType === 'channel' && notification.entityId === activeChannel) {
      return
    }

    // Sound effects logic
    if (notification.type === 'mention') {
      playNotificationSound('mention')
    } else if (notification.title.toLowerCase().includes('call')) {
      playNotificationSound('call')
    } else {
      playNotificationSound('message')
    }

    // Show Custom Toast
    showDiscordNotification({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      avatar: notification.metadata?.avatar || notification.avatar,
      entityType: notification.entityType,
      entityId: notification.entityId,
      linkUrl: notification.linkUrl,
      type: notification.type,
    })
  }, [activeChannel])

  useEffect(() => {
    if (!session?.user?.id) return

    const ably = getAblyClient()
    if (!ably) return

    const channel = ably.channels.get(AblyChannels.notifications(session.user.id))
    channel.subscribe(AblyEvents.NOTIFICATION, handleNotification)

    return () => {
      channel.unsubscribe(AblyEvents.NOTIFICATION, handleNotification)
    }
  }, [session?.user?.id, handleNotification])

  return null
}
