import type { Metadata } from "next"
import { UserPlus, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const metadata: Metadata = {
  title: "Department Settings",
  description: "Manage department settings and configuration",
}

export default function DepartmentSettingsPage({
  params,
}: {
  params: { slug: string; departmentId: string }
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Department Settings</h1>
            <p className="text-sm text-muted-foreground">Manage department configuration and members</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Information</CardTitle>
                <CardDescription>Update department details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dept-name">Department Name</Label>
                  <Input id="dept-name" defaultValue="Engineering" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept-desc">Description</Label>
                  <Textarea id="dept-desc" defaultValue="Technology and product development" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept-manager">Department Manager</Label>
                  <Select defaultValue="user-1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user-1">John Doe</SelectItem>
                      <SelectItem value="user-2">Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Members (45)</CardTitle>
                    <CardDescription>Manage department team members</CardDescription>
                  </div>
                  <Button>
                    <UserPlus className="mr-2 size-4" />
                    Add Member
                  </Button>
                </div>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Role</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Permissions</CardTitle>
                <CardDescription>Configure access and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Create Channels</Label>
                    <p className="text-sm text-muted-foreground">Who can create channels</p>
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                      <SelectItem value="manager">Manager Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Create Projects</Label>
                    <p className="text-sm text-muted-foreground">Who can create projects</p>
                  </div>
                  <Select defaultValue="admins">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                      <SelectItem value="manager">Manager Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Save Permissions</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent department activity</CardDescription>
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
