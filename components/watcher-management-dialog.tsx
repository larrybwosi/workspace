"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockUsers } from "@/lib/mock-data"
import { Bell, BellOff, Search, X } from 'lucide-react'

interface WatcherManagementDialogProps {
  taskId: string
  watchers: string[]
  onUpdateWatchers: (watchers: string[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WatcherManagementDialog({
  taskId,
  watchers,
  onUpdateWatchers,
  open,
  onOpenChange,
}: WatcherManagementDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [localWatchers, setLocalWatchers] = React.useState<string[]>(watchers)

  React.useEffect(() => {
    setLocalWatchers(watchers)
  }, [watchers])

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleWatcher = (userId: string) => {
    setLocalWatchers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const handleSave = () => {
    onUpdateWatchers(localWatchers)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Manage Watchers
          </DialogTitle>
          <DialogDescription>
            Watchers will receive notifications about all updates to this task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* User List */}
          <ScrollArea className="h-[300px] rounded-lg border">
            <div className="p-2 space-y-1">
              {filteredUsers.map((user) => {
                const isWatching = localWatchers.includes(user.id)
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleWatcher(user.id)}
                    className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {isWatching ? (
                      <Badge variant="default" className="gap-1">
                        <Bell className="h-3 w-3" />
                        Watching
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <BellOff className="h-3 w-3" />
                        Not watching
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>

          {/* Summary */}
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-muted-foreground">{localWatchers.length} watching</span>
            {localWatchers.length !== watchers.length && (
              <Badge variant="secondary" className="text-xs">
                {Math.abs(localWatchers.length - watchers.length)} change(s)
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
