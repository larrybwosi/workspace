"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Check, X, MoreVertical, MessageSquare } from "lucide-react"
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

export default function FriendsPage() {
  const [search, setSearch] = useState("")
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [friendEmail, setFriendEmail] = useState("")
  const [friendMessage, setFriendMessage] = useState("")
  const { toast } = useToast()

  const { data: friends, isLoading: friendsLoading } = useFriends(search)
  const { data: receivedRequests, isLoading: receivedLoading } = useFriendRequests("received", "pending")
  const { data: sentRequests, isLoading: sentLoading } = useFriendRequests("sent", "pending")

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

  const handleSendRequest = async () => {
    if (!friendEmail) {
      toast({ title: "Please enter an email", variant: "destructive" })
      return
    }

    try {
      await sendRequestMutation.mutateAsync({
        receiverId: friendEmail, // Should be userId, you'd need to look up by email first
        message: friendMessage,
      })
      toast({ title: "Friend request sent" })
      setAddFriendOpen(false)
      setFriendEmail("")
      setFriendMessage("")
    } catch (error: any) {
      toast({ title: error.response?.data?.error || "Failed to send request", variant: "destructive" })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Friends</h1>
            <p className="text-sm text-muted-foreground">Manage your contacts and friend requests</p>
          </div>
          <Dialog open={addFriendOpen} onOpenChange={setAddFriendOpen}>
            <DialogTrigger asChild>
              <Button>
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
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="friend@example.com"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
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
                <Button onClick={handleSendRequest} disabled={sendRequestMutation.isPending}>
                  {sendRequestMutation.isPending ? "Sending..." : "Send Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="all">All Friends {friends?.length ? `(${friends.length})` : ""}</TabsTrigger>
          <TabsTrigger value="pending">
            Pending {receivedRequests?.length ? `(${receivedRequests.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent {sentRequests?.length ? `(${sentRequests.length})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 p-4 space-y-2">
          {friendsLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : !friends || friends.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No friends yet. Send a friend request to get started!</p>
            </Card>
          ) : (
            friends.map((friend: any) => (
              <Card key={friend.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friend.friend.avatar || friend.friend.image} />
                      <AvatarFallback>{friend.friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{friend.nickname || friend.friend.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {friend.friend.email}
                        <Badge
                          variant={friend.friend.status === "online" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {friend.friend.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
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
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="flex-1 p-4 space-y-2">
          {receivedLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : !receivedRequests || receivedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending friend requests</p>
            </Card>
          ) : (
            receivedRequests.map((request: any) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.sender.avatar || request.sender.image} />
                      <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{request.sender.name}</div>
                      <div className="text-sm text-muted-foreground">{request.sender.email}</div>
                      {request.message && (
                        <div className="text-sm text-muted-foreground italic mt-1">"{request.message}"</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleAccept(request.id)} disabled={respondMutation.isPending}>
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(request.id)}
                      disabled={respondMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="flex-1 p-4 space-y-2">
          {sentLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : !sentRequests || sentRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No sent friend requests</p>
            </Card>
          ) : (
            sentRequests.map((request: any) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.receiver.avatar || request.receiver.image} />
                      <AvatarFallback>{request.receiver.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{request.receiver.name}</div>
                      <div className="text-sm text-muted-foreground">{request.receiver.email}</div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        Pending
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondMutation.mutate({ requestId: request.id, action: "cancel" })}
                    disabled={respondMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
