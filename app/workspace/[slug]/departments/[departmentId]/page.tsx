import type { Metadata } from "next"
import { Hash, Settings, UserPlus, Trash2, Edit, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const metadata: Metadata = {
  title: "Department Details",
  description: "View and manage department details",
}

export default function DepartmentDetailPage({
  params,
}: {
  params: { slug: string; departmentId: string }
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">💻</div>
            <div>
              <h1 className="text-2xl font-semibold">Engineering</h1>
              <p className="text-sm text-muted-foreground">Technology and product development</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                  Edit Department
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 size-4" />
                  Delete Department
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
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Members</CardDescription>
                  <CardTitle className="text-3xl">45</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Channels</CardDescription>
                  <CardTitle className="text-3xl">8</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Projects</CardDescription>
                  <CardTitle className="text-3xl">12</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Tasks Completed</CardDescription>
                  <CardTitle className="text-3xl">234</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Department Manager */}
            <Card>
              <CardHeader>
                <CardTitle>Department Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="size-12">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-muted-foreground">john.doe@company.com</p>
                  </div>
                  <Badge>Manager</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Avatar className="size-8">
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">User {i}</span> completed task in project
                        </p>
                        <p className="text-xs text-muted-foreground">{i} hours ago</p>
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
                <CardTitle>Department Members (45)</CardTitle>
                <CardDescription>All members in this department</CardDescription>
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
                          <p className="text-sm text-muted-foreground">member{i + 1}@company.com</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Developer</Badge>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Channels (8)</CardTitle>
                <CardDescription>Communication channels for this department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["general", "dev-team", "announcements", "code-review", "standup"].map((channel) => (
                    <div key={channel} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Hash className="size-4 text-muted-foreground" />
                        <span className="font-medium">{channel}</span>
                      </div>
                      <Badge variant="secondary">Public</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Activity</CardTitle>
                <CardDescription>Recent activity and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Avatar className="size-8">
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">User {i}</span> performed action in the department
                        </p>
                        <p className="text-xs text-muted-foreground">{i} hours ago</p>
                      </div>
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
