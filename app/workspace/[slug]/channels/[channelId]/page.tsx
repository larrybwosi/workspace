import type { Metadata } from "next"
import { Hash, Settings, UserPlus, Trash2, Edit, MoreVertical, Bell, Pin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const metadata: Metadata = {
  title: "Channel Details",
  description: "View and manage channel details",
}

export default function ChannelDetailPage({
  params,
}: {
  params: { slug: string; channelId: string }
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Hash className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold"># general</h1>
              <p className="text-sm text-muted-foreground">General discussions and updates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Bell className="size-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Pin className="size-4" />
            </Button>
            <Button variant="outline">
              <UserPlus className="mr-2 size-4" />
              Add Members
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 size-4" />
                  Edit Channel
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Channel Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 size-4" />
                  Delete Channel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Members</CardDescription>
                  <CardTitle className="text-3xl">127</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Messages Today</CardDescription>
                  <CardTitle className="text-3xl">48</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Files Shared</CardDescription>
                  <CardTitle className="text-3xl">23</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pinned Messages</CardDescription>
                  <CardTitle className="text-3xl">5</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Channel Info */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Channel Type</span>
                  <Badge>Public</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">January 15, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <span className="text-sm">Engineering</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Notifications</span>
                  <Badge variant="secondary">All Messages</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Pinned Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Pinned Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 rounded-lg border p-3">
                      <Avatar className="size-8">
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">User {i}</span>
                          <span className="text-xs text-muted-foreground">2 days ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Important announcement message that was pinned to the channel
                        </p>
                      </div>
                      <Pin className="size-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Channel Messages</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-8 w-[300px]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Avatar>
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">User {i}</span>
                          <span className="text-xs text-muted-foreground">{i} hours ago</span>
                        </div>
                        <p className="text-sm">Sample message content for channel #{i}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Channel Members (127)</CardTitle>
                <CardDescription>All members with access to this channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>U{i}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Team Member {i + 1}</p>
                          <p className="text-sm text-muted-foreground">Last active: {i + 1}h ago</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shared Files (23)</CardTitle>
                <CardDescription>Files shared in this channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10">📄</div>
                      <p className="font-medium text-sm">Document-{i + 1}.pdf</p>
                      <p className="text-xs text-muted-foreground">Shared {i + 1} days ago</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
