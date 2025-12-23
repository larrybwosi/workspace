"use client"

import * as React from "react"
import { Search, UserPlus, MessageSquare, Loader2, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserSearch } from "@/hooks/api/use-user-search"
import { useFriends } from "@/hooks/api/use-friends"
import { useCreateDMConversation } from "@/hooks/api/use-dm"
import { useSendFriendRequest } from "@/hooks/api/use-friends"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface StartDMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartDMDialog({ open, onOpenChange }: StartDMDialogProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchTab, setSearchTab] = React.useState<"friends" | "all">("friends")

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useFriends()

  // Search users
  const { data: searchResults, isLoading: searchLoading } = useUserSearch(searchQuery, searchTab === "friends")

  // Mutations
  const createDM = useCreateDMConversation()
  const sendFriendRequest = useSendFriendRequest()

  const handleStartDM = async (userId: string, userName: string) => {
    try {
      const conversation = await createDM.mutateAsync(userId)
      toast.success(`Started conversation with ${userName}`)
      onOpenChange(false)
      setSearchQuery("")
      // Navigate to DM
      router.push(`/dm/${userId}`)
    } catch (error) {
      toast.error("Failed to start conversation")
      console.error("[v0] Error starting DM:", error)
    }
  }

  const handleSendFriendRequest = async (userId: string, userName: string) => {
    try {
      await sendFriendRequest.mutateAsync({ receiverId: userId })
      toast.success(`Friend request sent to ${userName}`)
    } catch (error) {
      toast.error("Failed to send friend request")
      console.error("[v0] Error sending friend request:", error)
    }
  }

  // Filter friends based on search
  const filteredFriends = React.useMemo(() => {
    if (!searchQuery.trim()) return friends
    const query = searchQuery.toLowerCase()
    return friends.filter(
      (friend: any) =>
        friend.friend.name.toLowerCase().includes(query) || friend.friend.email.toLowerCase().includes(query),
    )
  }, [friends, searchQuery])

  const displayUsers = searchTab === "friends" ? filteredFriends : searchResults?.users || []

  const isLoading = searchTab === "friends" ? friendsLoading : searchLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Start a conversation</DialogTitle>
          <DialogDescription>Search for friends or users to start messaging</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v as "friends" | "all")} className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="friends" className="gap-2">
                <Users className="h-4 w-4" />
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <Search className="h-4 w-4" />
                All Users
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="friends" className="mt-0 flex-1">
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">{searchQuery ? "No friends found" : "No friends yet"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery ? "Try a different search term" : "Add friends to start conversations"}
                  </p>
                </div>
              ) : (
                <div className="px-2 py-2">
                  {filteredFriends.map((friendship: any) => (
                    <div
                      key={friendship.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {friendship.friend.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{friendship.nickname || friendship.friend.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{friendship.friend.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            friendship.friend.status === "online" &&
                              "bg-green-500/10 text-green-700 dark:text-green-400",
                          )}
                        >
                          {friendship.friend.status}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleStartDM(friendship.friendId, friendship.friend.name)}
                          disabled={createDM.isPending}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-0 flex-1">
            <ScrollArea className="h-[300px]">
              {!searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Start typing to search</p>
                  <p className="text-xs text-muted-foreground mt-1">Search by name or email to find users</p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No users found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try searching with a different name or email</p>
                </div>
              ) : (
                <div className="px-2 py-2">
                  {displayUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          {user.isFriend && (
                            <Badge variant="secondary" className="text-xs">
                              Friend
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isFriend ? (
                          <Button
                            size="sm"
                            onClick={() => handleStartDM(user.id, user.name)}
                            disabled={createDM.isPending}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        ) : user.hasPendingRequest ? (
                          <Badge variant="outline" className="text-xs">
                            Request Pending
                          </Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendFriendRequest(user.id, user.name)}
                              disabled={sendFriendRequest.isPending}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add Friend
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStartDM(user.id, user.name)}
                              disabled={createDM.isPending}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
