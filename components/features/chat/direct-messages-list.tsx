"use client"

import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockUsers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface DirectMessagesListProps {
  activeUserId?: string
  onUserSelect: (userId: string) => void
}

export function DirectMessagesList({ activeUserId, onUserSelect }: DirectMessagesListProps) {
  const [users] = React.useState(mockUsers.slice(1)) // Exclude current user

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-0.5">
        {users.map((user) => (
          <Button
            key={user.id}
            variant={activeUserId === user.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start h-auto py-2 px-3",
              activeUserId === user.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent",
            )}
            onClick={() => onUserSelect(user.id)}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">{user.avatar}</AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "absolute bottom-0 right-0 h-2.5 w-2.5 border-2 border-sidebar rounded-full",
                    user.status === "online"
                      ? "bg-green-500"
                      : user.status === "away"
                        ? "bg-yellow-500"
                        : "bg-gray-400",
                  )}
                />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
              </div>
              {Math.random() > 0.7 && (
                <Badge variant="secondary" className="ml-auto">
                  {Math.floor(Math.random() * 5) + 1}
                </Badge>
              )}
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}
