"use client"

import * as React from "react"
import { Activity, User, FileText, Settings, MessageSquare, Shield } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"

export function AdminActivity() {
  const activities = [
    {
      id: "1",
      user: { name: "Alice Johnson", avatar: "AJ" },
      action: "created",
      entity: "project",
      entityName: "Website Redesign",
      timestamp: new Date(2024, 2, 10, 14, 30),
      icon: FileText,
    },
    {
      id: "2",
      user: { name: "Bob Smith", avatar: "BS" },
      action: "updated",
      entity: "settings",
      entityName: "Notification preferences",
      timestamp: new Date(2024, 2, 10, 13, 15),
      icon: Settings,
    },
    {
      id: "3",
      user: { name: "Carol Davis", avatar: "CD" },
      action: "sent",
      entity: "message",
      entityName: "in #general",
      timestamp: new Date(2024, 2, 10, 12, 45),
      icon: MessageSquare,
    },
    {
      id: "4",
      user: { name: "Alice Johnson", avatar: "AJ" },
      action: "granted",
      entity: "permission",
      entityName: "Admin access to Bob Smith",
      timestamp: new Date(2024, 2, 10, 11, 20),
      icon: Shield,
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </h3>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{activity.user.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>
                    <span className="text-muted-foreground"> {activity.action} </span>
                    <span className="font-medium">{activity.entityName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <activity.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
