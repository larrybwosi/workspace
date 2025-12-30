"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDMConversations } from "@/hooks/api/use-dm"
import { cn } from "@/lib/utils"

interface DirectMessagesListProps {
  activeUserId?: string
  onUserSelect: (userId: string) => void
}

export function DirectMessagesList({ activeUserId, onUserSelect }: DirectMessagesListProps) {
  const { data: dmConversations = [], isLoading } = useDMConversations()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading conversations...</p>
      </div>
    )
  }

  if (dmConversations.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-0.5">
        {dmConversations.map((dm: any) => {
          const otherUser = dm.members.find((m: any) => m.id !== dm.creatorId) || dm.members[0]
          const lastMessage = dm.messages?.[0]

          return (
            <Button
              key={dm.id}
              variant={activeUserId === otherUser.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-auto py-2 px-3",
                activeUserId === otherUser.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent",
              )}
              onClick={() => onUserSelect(otherUser.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {otherUser.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "absolute bottom-0 right-0 h-2.5 w-2.5 border-2 border-sidebar rounded-full",
                      otherUser.status === "online"
                        ? "bg-green-500"
                        : otherUser.status === "away"
                          ? "bg-yellow-500"
                          : "bg-gray-400",
                    )}
                  />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{otherUser.name}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">
                    {lastMessage?.content || "No messages yet"}
                  </p>
                </div>
                {dm._count?.messages > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {dm._count.messages}
                  </Badge>
                )}
              </div>
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
