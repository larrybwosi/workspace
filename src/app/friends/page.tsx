"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Check, X, MoreVertical, MessageSquare, UserCheck, Users } from "lucide-react"
import {
  useFriends,
  useFriendRequests,
  useRespondToFriendRequest,
  useRemoveFriend,
  useSendFriendRequest,
} from "@/hooks/api/use-friends"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useUsers } from "@/hooks/api/use-users"
import { cn } from "@/lib/utils"
import { usePresence } from "@/lib/contexts/presence-context"

export default function FriendsPage() {
  const [search, setSearch] = useState("")
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [friendEmail, setFriendEmail] = useState("")
  const [friendMessage, setFriendMessage] = useState("")
  const { toast } = useToast()

  const { data: friends, isLoading: friendsLoading } = useFriends(search)
  const { data: receivedRequests, isLoading: receivedLoading } = useFriendRequests("received", "pending")
  const { data: sentRequests, isLoading: sentLoading } = useFriendRequests("sent", "pending")
  const { data: allUsers } = useUsers()
  const { onlineUsers } = usePresence()

  const respondMutation = useRespondToFriendRequest()
  const removeMutation = useRemoveFriend()
  const sendRequestMutation = useSendFriendRequest()

  const handleAccept = async (requestId: string) => {
    try {
      await respondMutation.mutateAsync({ requestId, action: "accept" })
      toast({ title: "Friend request accepted" })
    } catch (error) {
      toast({ title: "Failed to accept request", variant: "destructive" })
    }
  }

  const handleDecline = async (requestId: string) => {
    try {
      await respondMutation.mutateAsync({ requestId, action: "decline" })
      toast({ title: "Friend request declined" })
    } catch (error) {
      toast({ title: "Failed to decline request", variant: "destructive" })
    }
  }

  const handleRemove = async (friendId: string) => {
    try {
      await removeMutation.mutateAsync(friendId)
      toast({ title: "Friend removed" })
    } catch (error) {
      toast({ title: "Failed to remove friend", variant: "destructive" })
    }
  }

  const handleSendRequest = async (email?: string) => {
    const targetEmail = email || friendEmail
    if (!targetEmail) {
      toast({ title: "Please enter an email", variant: "destructive" })
      return
    }

    try {
      await sendRequestMutation.mutateAsync({
        receiverId: targetEmail,
        message: email ? "Hi! I'd like to connect." : friendMessage,
      })
      toast({ title: "Friend request sent" })
      setAddFriendOpen(false)
      setFriendEmail("")
      setFriendMessage("")
    } catch (error: any) {
      toast({ title: error.response?.data?.error || "Failed to send request", variant: "destructive" })
    }
  }

  const suggestedFriends = allUsers?.filter(u =>
    !friends?.some((f: any) => f.friendId === u.id) &&
    !sentRequests?.some((r: any) => r.receiverId === u.id) &&
    !receivedRequests?.some((r: any) => r.senderId === u.id)
  ).slice(0, 5)

  return (
    <div className="flex-1 flex flex-col h-full bg-muted/10">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Social</h1>
            <p className="text-muted-foreground">Manage your connections and discover new people</p>
          </div>
          <Dialog open={addFriendOpen} onOpenChange={setAddFriendOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Friend Request</DialogTitle>
                <DialogDescription>Enter the user's email to send a friend request</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Input
                    id="message"
                    placeholder="Hi! Let's connect..."
                    value={friendMessage}
                    onChange={(e) => setFriendMessage(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddFriendOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSendRequest()} disabled={sendRequestMutation.isPending}>
                  {sendRequestMutation.isPending ? "Sending..." : "Send Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-muted/30 border-none shadow-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <div className="px-6 border-b bg-background">
              <TabsList className="bg-transparent h-12 p-0 gap-6">
                <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                  All Friends {friends?.length ? `(${friends.length})` : ""}
                </TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                  Pending {receivedRequests?.length ? `(${receivedRequests.length})` : ""}
                </TabsTrigger>
                <TabsTrigger value="sent" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                  Sent {sentRequests?.length ? `(${sentRequests.length})` : ""}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="flex-1 overflow-auto p-6 space-y-3">
              {friendsLoading ? (
                <div className="flex justify-center py-20"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : !friends || friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-medium">No friends yet</p>
                    <p className="text-muted-foreground">Start connecting with your colleagues</p>
                  </div>
                </div>
              ) : (
                friends.map((friend: any) => (
                  <Card key={friend.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border">
                              <AvatarImage src={friend.friend.avatar || friend.friend.image} />
                              <AvatarFallback>{friend.friend.name[0]}</AvatarFallback>
                            </Avatar>
                            {onlineUsers.has(friend.friend.id) && (
                              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full shadow-sm" title="Online" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold flex items-center gap-2">
                              {friend.nickname || friend.friend.name}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">{friend.friend.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" className="h-9">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Set Nickname</DropdownMenuItem>
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(friend.friendId)}>
                                Remove Friend
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="flex-1 overflow-auto p-6 space-y-3">
              {receivedLoading ? (
                <div className="flex justify-center py-20"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : !receivedRequests || receivedRequests.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">No pending friend requests</div>
              ) : (
                receivedRequests.map((request: any) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border">
                            <AvatarImage src={request.sender.avatar || request.sender.image} />
                            <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{request.sender.name}</div>
                            <div className="text-sm text-muted-foreground">{request.sender.email}</div>
                            {request.message && <div className="text-xs italic bg-muted/50 p-2 rounded mt-2">"{request.message}"</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => handleAccept(request.id)} disabled={respondMutation.isPending}>
                            Accept
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDecline(request.id)} disabled={respondMutation.isPending}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="flex-1 overflow-auto p-6 space-y-3">
              {sentLoading ? (
                <div className="flex justify-center py-20"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : !sentRequests || sentRequests.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">No sent friend requests</div>
              ) : (
                sentRequests.map((request: any) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border">
                            <AvatarImage src={request.receiver.avatar || request.receiver.image} />
                            <AvatarFallback>{request.receiver.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{request.receiver.name}</div>
                            <div className="text-sm text-muted-foreground">{request.receiver.email}</div>
                            <Badge variant="secondary" className="mt-1">Pending</Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => respondMutation.mutate({ requestId: request.id, action: "cancel" })}
                          disabled={respondMutation.isPending}
                        >
                          Cancel Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Suggestions */}
        <div className="w-80 border-l bg-background hidden lg:flex flex-col p-6 space-y-6">
          <h3 className="font-bold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            Suggested Friends
          </h3>
          <div className="space-y-4">
            {suggestedFriends?.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || user.image} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate w-32">{user.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate w-32">{user.email}</div>
                  </div>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSendRequest(user.email)}>
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {(!suggestedFriends || suggestedFriends.length === 0) && (
              <p className="text-xs text-muted-foreground italic">No suggestions at this time</p>
            )}
          </div>

          <div className="pt-6 border-t">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <h4 className="text-sm font-bold mb-1">Invite your friends</h4>
              <p className="text-xs text-muted-foreground mb-3">Expand your network on Dealio by inviting your colleagues.</p>
              <Button size="sm" className="w-full" onClick={() => setAddFriendOpen(true)}>Send Invite</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
