"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, Trash2, Bell, MessageSquare, AtSign, UserPlus, Info, CheckCircle2, X } from "lucide-react"
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from "@/hooks/api/use-notifications"
import { useToast } from "@/hooks/use-toast"
import { format, isToday, isYesterday } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const { data: notifications, isLoading } = useNotifications(filter === "unread")
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()
  const deleteMutation = useDeleteNotification()
  const { toast } = useToast()

  const groupedNotifications = useMemo(() => {
    if (!notifications) return {}

    return notifications.reduce((groups: any, notification: any) => {
      const date = new Date(notification.createdAt)
      let label = ""

      if (isToday(date)) label = "Today"
      else if (isYesterday(date)) label = "Yesterday"
      else label = format(date, "MMMM d, yyyy")

      if (!groups[label]) groups[label] = []
      groups[label].push(notification)
      return groups
    }, {})
  }, [notifications])

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
      toast({ title: "All notifications marked as read" })
    } catch (error) {
      toast({ title: "Failed to mark all as read", variant: "destructive" })
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id)
    } catch (error) {
      toast({ title: "Failed to mark as read", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast({ title: "Notification deleted" })
    } catch (error) {
      toast({ title: "Failed to delete notification", variant: "destructive" })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "mention": return <AtSign className="h-4 w-4 text-blue-500" />
      case "channel_alert": return <Bell className="h-4 w-4 text-amber-500" />
      case "workspace_invitation": return <UserPlus className="h-4 w-4 text-green-500" />
      case "system": return <Info className="h-4 w-4 text-slate-500" />
      default: return <Bell className="h-4 w-4 text-primary" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-lg">Stay updated with your latest activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllReadMutation.isPending || !notifications?.some((n: any) => !n.isRead)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as any)} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all" className="px-6">All</TabsTrigger>
          <TabsTrigger value="unread" className="px-6">Unread</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground animate-pulse">Loading notifications...</p>
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <Card className="border-dashed py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-medium">No notifications yet</p>
                  <p className="text-muted-foreground">We'll let you know when something happens</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedNotifications).map(([label, group]: [string, any]) => (
              <div key={label} className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">{label}</h2>
                <div className="space-y-2">
                  {group.map((notification: any) => (
                    <Card
                      key={notification.id}
                      className={cn(
                        "group transition-all duration-200 hover:shadow-md",
                        !notification.isRead ? "border-l-4 border-l-primary bg-primary/5" : "bg-card"
                      )}
                    >
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="mt-1">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            !notification.isRead ? "bg-primary/10" : "bg-muted"
                          )}>
                            {getIcon(notification.type)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "font-semibold truncate",
                              !notification.isRead ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {format(new Date(notification.createdAt), "h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-3 pt-2">
                            {notification.linkUrl && (
                              <Button asChild size="sm" variant="secondary" className="h-8">
                                <Link href={notification.linkUrl}>View Details</Link>
                              </Button>
                            )}
                            {notification.type === "workspace_invitation" && (
                              <div className="flex gap-2">
                                <Button size="sm" className="h-8 px-4">Accept</Button>
                                <Button size="sm" variant="ghost" className="h-8 px-4">Decline</Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={() => handleMarkRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(notification.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
        <TabsContent value="unread">
           {/* Same as above but with filter='unread' applied in hook */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
