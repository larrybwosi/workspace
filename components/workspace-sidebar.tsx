"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Users,
  Settings,
  ChevronDown,
  Plus,
  Search,
  Bell,
  FileText,
  BarChart3,
  Building2,
  Calendar,
  Sparkles,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface WorkspaceSidebarProps {
  workspaceSlug: string
  isOpen: boolean
  onClose: () => void
}

export function WorkspaceSidebar({ workspaceSlug, isOpen, onClose }: WorkspaceSidebarProps) {
  const router = useRouter()
  const [projectsOpen, setProjectsOpen] = React.useState(true)
  const [channelsOpen, setChannelsOpen] = React.useState(true)
  const [departmentsOpen, setDepartmentsOpen] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Mock data - replace with actual API calls
  const workspace = {
    name: "Acme Corporation",
    icon: "🏢",
    plan: "enterprise",
  }

  const departments = [
    { id: "dept-1", name: "Engineering", icon: "💻", members: 45, channels: 8 },
    { id: "dept-2", name: "Product", icon: "🎨", members: 23, channels: 5 },
    { id: "dept-3", name: "Marketing", icon: "📢", members: 18, channels: 6 },
    { id: "dept-4", name: "Sales", icon: "💼", members: 32, channels: 7 },
  ]

  const projects = [
    { id: "proj-1", name: "Q1 Product Launch", status: "in-progress", tasks: 24, progress: 67 },
    { id: "proj-2", name: "Website Redesign", status: "in-progress", tasks: 18, progress: 45 },
    { id: "proj-3", name: "Mobile App v2", status: "planning", tasks: 32, progress: 12 },
  ]

  const channels = [
    { id: "ch-1", name: "general", unread: 5 },
    { id: "ch-2", name: "announcements", unread: 2 },
    { id: "ch-3", name: "random", unread: 0 },
  ]

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Workspace Header */}
        <div className="border-b border-sidebar-border p-4 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
              {workspace.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base truncate">{workspace.name}</h2>
              <Badge className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-500 to-orange-500">ENTERPRISE</Badge>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workspace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-sidebar-accent/50"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {/* Quick Actions */}
            <Link href={`/workspace/${workspaceSlug}`}>
              <Button variant="ghost" className="w-full justify-start h-9 px-3">
                <LayoutDashboard className="h-4 w-4 mr-3" />
                <span className="text-sm font-medium">Dashboard</span>
              </Button>
            </Link>

            <Link href={`/workspace/${workspaceSlug}/analytics`}>
              <Button variant="ghost" className="w-full justify-start h-9 px-3">
                <BarChart3 className="h-4 w-4 mr-3" />
                <span className="text-sm font-medium">Analytics</span>
              </Button>
            </Link>

            <Link href={`/workspace/${workspaceSlug}/calendar`}>
              <Button variant="ghost" className="w-full justify-start h-9 px-3">
                <Calendar className="h-4 w-4 mr-3" />
                <span className="text-sm font-medium">Calendar</span>
              </Button>
            </Link>

            <Button variant="ghost" className="w-full justify-start h-9 px-3">
              <Bell className="h-4 w-4 mr-3" />
              <span className="text-sm font-medium">Activity</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                12
              </Badge>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-9 px-3">
              <Sparkles className="h-4 w-4 mr-3" />
              <span className="text-sm font-medium">AI Assistant</span>
              <Badge variant="secondary" className="ml-auto text-xs bg-blue-500/20 text-blue-400 border-0">
                NEW
              </Badge>
            </Button>
          </div>

          {/* Departments */}
          <div className="px-3 py-3 mt-2 border-t border-sidebar-border">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                className="flex-1 justify-start h-8 px-2 text-xs font-semibold text-muted-foreground"
                onClick={() => setDepartmentsOpen(!departmentsOpen)}
              >
                <ChevronDown className={cn("h-3 w-3 mr-2 transition-transform", !departmentsOpen && "-rotate-90")} />
                <Building2 className="h-4 w-4 mr-2" />
                Departments
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Add department">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {departmentsOpen && (
              <div className="space-y-0.5">
                {departments.map((dept) => (
                  <Button
                    key={dept.id}
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 hover:bg-sidebar-accent"
                    onClick={() => router.push(`/workspace/${workspaceSlug}/departments/${dept.id}`)}
                  >
                    <span className="mr-2 text-base">{dept.icon}</span>
                    <span className="flex-1 text-left text-sm truncate">{dept.name}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {dept.members}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="px-3 py-3 border-t border-sidebar-border">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                className="flex-1 justify-start h-8 px-2 text-xs font-semibold text-muted-foreground"
                onClick={() => setProjectsOpen(!projectsOpen)}
              >
                <ChevronDown className={cn("h-3 w-3 mr-2 transition-transform", !projectsOpen && "-rotate-90")} />
                <FolderKanban className="h-4 w-4 mr-2" />
                Projects
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Create project">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {projectsOpen && (
              <div className="space-y-0.5">
                {projects.map((project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 hover:bg-sidebar-accent flex-col items-start py-2"
                    onClick={() => router.push(`/workspace/${workspaceSlug}/projects/${project.id}`)}
                  >
                    <div className="flex items-center w-full">
                      <span className="flex-1 text-left text-sm truncate">{project.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {project.tasks}
                      </Badge>
                    </div>
                    <div className="w-full mt-1">
                      <div className="h-1 bg-sidebar-accent rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Channels */}
          <div className="px-3 py-3 border-t border-sidebar-border">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                className="flex-1 justify-start h-8 px-2 text-xs font-semibold text-muted-foreground"
                onClick={() => setChannelsOpen(!channelsOpen)}
              >
                <ChevronDown className={cn("h-3 w-3 mr-2 transition-transform", !channelsOpen && "-rotate-90")} />
                <MessageSquare className="h-4 w-4 mr-2" />
                Channels
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Create channel">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {channelsOpen && (
              <div className="space-y-0.5">
                {channels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 hover:bg-sidebar-accent"
                    onClick={() => router.push(`/workspace/${workspaceSlug}/channels/${channel.id}`)}
                  >
                    <span className="mr-2 text-muted-foreground">#</span>
                    <span className="flex-1 text-left text-sm truncate">{channel.name}</span>
                    {channel.unread > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {channel.unread}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="px-3 py-3 border-t border-sidebar-border">
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">Quick Links</div>
            <div className="space-y-0.5">
              <Link href={`/workspace/${workspaceSlug}/members`}>
                <Button variant="ghost" className="w-full justify-start h-9 px-3">
                  <Users className="h-4 w-4 mr-3" />
                  <span className="text-sm">Members</span>
                </Button>
              </Link>
              <Link href={`/workspace/${workspaceSlug}/notes`}>
                <Button variant="ghost" className="w-full justify-start h-9 px-3">
                  <FileText className="h-4 w-4 mr-3" />
                  <span className="text-sm">Documents</span>
                </Button>
              </Link>
              <Link href={`/workspace/${workspaceSlug}/settings`}>
                <Button variant="ghost" className="w-full justify-start h-9 px-3">
                  <Settings className="h-4 w-4 mr-3" />
                  <span className="text-sm">Settings</span>
                </Button>
              </Link>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <Button variant="outline" className="w-full justify-start h-10 bg-transparent" size="sm">
            <Avatar className="h-7 w-7 mr-2">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium truncate">John Doe</div>
              <div className="text-xs text-muted-foreground">Admin</div>
            </div>
          </Button>
        </div>
      </aside>
    </>
  )
}
