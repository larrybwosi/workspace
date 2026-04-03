"use client"

import * as React from "react"
import { X, MessageSquare, Bell, Calendar, Video, Phone } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DiscordNotificationToastProps {
  notification: {
    id: string
    title: string
    message: string
    avatar?: string
    entityType?: string
    entityId?: string
    linkUrl?: string
    type: string
  }
  onClose: () => void
}

export function DiscordNotificationToast({ notification, onClose }: DiscordNotificationToastProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "mention":
        return <Bell className="h-4 w-4 text-primary" />
      case "channel_alert":
      case "workspace_alert":
        return <MessageSquare className="h-4 w-4 text-primary" />
      case "system":
        return <Calendar className="h-4 w-4 text-primary" />
      default:
        return <Bell className="h-4 w-4 text-primary" />
    }
  }

  const isCall = notification.title.toLowerCase().includes("call") || notification.message.toLowerCase().includes("call")

  return (
    <div className="flex w-full max-w-sm pointer-events-auto rounded-lg bg-background/95 backdrop-blur-sm border border-border shadow-lg overflow-hidden group hover:bg-accent/10 transition-colors">
      <div className="p-3 flex items-start gap-3 w-full">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={notification.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {notification.title.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center shadow-sm border border-border">
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-sm font-bold text-foreground truncate">
              {notification.title}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault()
                onClose()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
            {notification.message}
          </p>

          {notification.linkUrl && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary" className="h-7 text-[11px] px-3 font-semibold" asChild onClick={onClose}>
                <Link href={notification.linkUrl}>
                  View Details
                </Link>
              </Button>
              {isCall && (
                <Button size="sm" variant="default" className="h-7 text-[11px] px-3 font-semibold" asChild onClick={onClose}>
                   <Link href={notification.linkUrl}>
                    {notification.message.includes("video") ? <Video className="h-3 w-3 mr-1" /> : <Phone className="h-3 w-3 mr-1" />}
                    Join Call
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
