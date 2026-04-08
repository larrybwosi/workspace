"use client"

import * as React from "react"
import { Search, UserPlus, MessageSquare, Loader2, Users, Link as LinkIcon, Copy } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Avatar, AvatarFallback } from "../../ui/avatar"
import { Badge } from "../../ui/badge"
import { ScrollArea } from "../../ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { useUserSearch } from "@repo/api-client"
import { useFriends } from "@repo/api-client"
import { useCreateDM as useCreateDMConversation } from "@repo/api-client"
import { useSendFriendRequest } from "@repo/api-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "../../lib/utils"

interface StartDMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartDMDialog({ open, onOpenChange }: StartDMDialogProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  const [searchTab, setSearchTab] = React.useState<"friends" | "all" | "invite">("friends")

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useFriends()

  // Search users
  const { data: searchResults, isLoading: searchLoading } = useUserSearch(
    debouncedQuery,
    searchTab === "friends",
  )

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
      console.error("Error starting DM:", error)
    }
  }

  const handleSendFriendRequest = async (userId: string, userName: string) => {
    try {
      await sendFriendRequest.mutateAsync({ receiverId: userId })
      toast.success(`Friend request sent to ${userName}`)
    } catch (error) {
      toast.error("Failed to send friend request")
      console.error("Error sending friend request:", error)
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

        <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v as any)} className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="friends" className="gap-2">
                <Users className="h-4 w-4" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <Search className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="invite" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite
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
                        <AvatarImage src={friendship.friend.avatar || friendship.friend.image} />
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

          <TabsContent value="invite" className="mt-0 flex-1">
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <LinkIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Invite to Platform</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Share this link with others to invite them to join the platform.
                </p>
              </div>

              <div className="w-full space-y-2 pt-4">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/link/generic-invite-token`}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/invite/link/generic-invite-token`)
                      toast.success("Invitation link copied to clipboard")
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  This link will expire in 7 days and can be used by anyone.
                </p>
              </div>

              <Button className="w-full" variant="outline" onClick={() => toast.info("Email invitations coming soon")}>
                Send Email Invitation
              </Button>
            </div>
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
                        <AvatarImage src={user.avatar} />
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
