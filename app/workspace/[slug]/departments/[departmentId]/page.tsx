"use client"

import { useParams } from "next/navigation"
import { Hash, Users, FolderKanban, Settings, UserPlus, Trash2, Edit, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function DepartmentPage() {
  const params = useParams()
  const slug = params.slug as string
  const departmentId = params.departmentId as string

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">💻</div>
            <div>
              <h1 className="text-2xl font-semibold">Engineering Department</h1>
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
                <DropdownMenuItem asChild>
                  <Link href={`/workspace/${slug}/departments/${departmentId}/settings`}>
                    <Settings className="mr-2 size-4" />
                    Department Settings
                  </Link>
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

      {/* Content - Main Department View */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Quick Stats */}
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
                <CardDescription>Tasks This Week</CardDescription>
                <CardTitle className="text-3xl">234</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Main Sections Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Channels Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="size-5" />
                    Channels
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["general", "dev-team", "announcements", "code-review"].map((channel) => (
                    <Link
                      key={channel}
                      href={`/workspace/${slug}/channels/${channel}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Hash className="size-4 text-muted-foreground" />
                        <span className="font-medium">{channel}</span>
                      </div>
                      <Badge variant="secondary">24 online</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projects Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="size-5" />
                    Projects
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["Mobile App Redesign", "API v2 Migration", "Dashboard Analytics", "Security Audit"].map(
                    (project, i) => (
                      <Link
                        key={project}
                        href={`/workspace/${slug}/projects/proj-${i}`}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{project}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${60 + i * 10}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{60 + i * 10}%</span>
                          </div>
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5" />
                  Team Members
                </CardTitle>
                <Button variant="outline" size="sm">
                  <UserPlus className="mr-2 size-4" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar>
                      <AvatarFallback>U{i}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">Team Member {i + 1}</p>
                      <p className="text-xs text-muted-foreground truncate">member{i + 1}@company.com</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Dev
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
