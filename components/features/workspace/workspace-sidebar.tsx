"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Hash,
  Lock,
} from "lucide-react"

// UI Imports
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

// API Hooks
import {
  useWorkspace,
  useWorkspaceDepartments,
  useWorkspaceProjects,
  useWorkspaceChannels,
  useUpdateDepartment,
  useDeleteDepartment,
  useUpdateWorkspaceProject,
  useDeleteWorkspaceProject,
  useUpdateWorkspaceChannel,
  useDeleteWorkspaceChannel,
} from "@/hooks/api/use-workspaces"

// Dialog Imports
import { CreateDepartmentDialog } from "@/components/workspace/create-department-dialog"
import { EditDepartmentDialog } from "@/components/workspace/edit-department-dialog"
import { DeleteDepartmentDialog } from "@/components/workspace/delete-department-dialog"
import { CreateProjectDialog } from "@/components/workspace/create-project-dialog"
import { EditProjectDialog } from "@/components/workspace/edit-project-dialog"
import { DeleteProjectDialog } from "@/components/workspace/delete-project-dialog"
import { CreateChannelDialog } from "@/components/workspace/create-channel-dialog"
import { EditChannelDialog } from "@/components/workspace/edit-channel-dialog"
import { DeleteChannelDialog } from "@/components/workspace/delete-channel-dialog"

// --- Interfaces ---
interface Department {
  id: string
  name: string
  icon: string
  members: number
  channels: number
}

interface Project {
  id: string
  name: string
  status: string
  tasks: number
  progress: number
}

interface Channel {
  id: string
  name: string
  type: "public" | "private"
  unread: number
}

export function WorkspaceSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter()
  const { toast } = useToast()

  // UI Toggles
  const [projectsOpen, setProjectsOpen] = React.useState(true)
  const [channelsOpen, setChannelsOpen] = React.useState(true)
  const [departmentsOpen, setDepartmentsOpen] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Dialog states
  const [createDeptOpen, setCreateDeptOpen] = React.useState(false)
  const [editDeptOpen, setEditDeptOpen] = React.useState(false)
  const [deleteDeptOpen, setDeleteDeptOpen] = React.useState(false)
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false)
  const [editProjectOpen, setEditProjectOpen] = React.useState(false)
  const [deleteProjectOpen, setDeleteProjectOpen] = React.useState(false)
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false)
  const [editChannelOpen, setEditChannelOpen] = React.useState(false)
  const [deleteChannelOpen, setDeleteChannelOpen] = React.useState(false)

  // Selected item for edit/delete
  const [selectedDept, setSelectedDept] = React.useState<Department | null>(null)
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  const [selectedChannel, setSelectedChannel] = React.useState<Channel | null>(null)

  // Form states
  const [deptForm, setDeptForm] = React.useState({ name: "", icon: "💼", description: "" })
  const [projectForm, setProjectForm] = React.useState({ name: "", description: "", status: "planning" })
  const [channelForm, setChannelForm] = React.useState({
    name: "",
    description: "",
    type: "public" as "public" | "private",
  })

  // --- Data Fetching & Loading States ---
  const { data: workspaceData, isLoading: isWorkspaceLoading } = useWorkspace(workspaceSlug)
  
  // Only fetch children if workspace ID is available
  const workspaceId = workspaceData?.id || ""

  const { data: departmentsData, isLoading: isDepartmentsLoading } = useWorkspaceDepartments(workspaceId)
  const { data: projectsData, isLoading: isProjectsLoading } = useWorkspaceProjects(workspaceId)
  const { data: channelsData, isLoading: isChannelsLoading } = useWorkspaceChannels(workspaceId)

  // Mutations
  const updateDepartment = useUpdateDepartment(workspaceId)
  const deleteDepartment = useDeleteDepartment(workspaceId)
  const updateProject = useUpdateWorkspaceProject(workspaceId)
  const deleteProject = useDeleteWorkspaceProject(workspaceId)
  const updateChannel = useUpdateWorkspaceChannel(workspaceId)
  const deleteChannel = useDeleteWorkspaceChannel(workspaceId)

  // Derived Data
  const departments = Array.isArray(departmentsData) ? departmentsData : []
  const projects = Array.isArray(projectsData) ? projectsData : []
  const channels = Array.isArray(channelsData) ? channelsData : []

  // --- Handlers ---
  const handleEditDept = async () => {
    if (!selectedDept) return
    try {
      await updateDepartment.mutateAsync({
        departmentId: selectedDept.id,
        data: {
          name: deptForm.name,
          icon: deptForm.icon,
          description: deptForm.description,
        },
      })
      setEditDeptOpen(false)
      setSelectedDept(null)
      toast({ title: "Department updated", description: "Department has been updated successfully." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to update department", variant: "destructive" })
    }
  }

  const handleDeleteDept = async () => {
    if (!selectedDept) return
    try {
      await deleteDepartment.mutateAsync(selectedDept.id)
      setDeleteDeptOpen(false)
      setSelectedDept(null)
      toast({ title: "Department deleted", description: "Department has been deleted successfully." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete department", variant: "destructive" })
    }
  }

  const handleEditProject = async () => {
    if (!selectedProject) return
    try {
      await updateProject.mutateAsync({
        projectId: selectedProject.id,
        data: {
          name: projectForm.name,
          status: projectForm.status as any,
        },
      })
      setEditProjectOpen(false)
      setSelectedProject(null)
      toast({ title: "Project updated", description: "Project has been updated successfully." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to update project", variant: "destructive" })
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return
    try {
      await deleteProject.mutateAsync(selectedProject.id)
      setDeleteProjectOpen(false)
      setSelectedProject(null)
      toast({ title: "Project deleted", description: "Project has been deleted successfully." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" })
    }
  }

  const handleEditChannel = async () => {
    if (!selectedChannel) return
    try {
      await updateChannel.mutateAsync({
        channelId: selectedChannel.id,
        data: {
          name: channelForm.name.toLowerCase().replace(/\s+/g, "-"),
          type: channelForm.type as "public" | "private",
        },
      })
      setEditChannelOpen(false)
      setSelectedChannel(null)
      toast({ title: "Channel updated", description: "Channel has been updated successfully." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to update channel", variant: "destructive" })
    }
  }

  const handleDeleteChannel = async () => {
    if (!selectedChannel) return
    try {
      await deleteChannel.mutateAsync(selectedChannel.id)
      setDeleteChannelOpen(false)
      setSelectedChannel(null)
      toast({ title: "Channel deleted", description: "Channel has been deleted successfully." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete channel", variant: "destructive" })
    }
  }

  const openEditDept = (dept: Department) => {
    setSelectedDept(dept)
    setDeptForm({ name: dept.name, icon: dept.icon, description: "" })
    setEditDeptOpen(true)
  }

  const openEditProject = (project: Project) => {
    setSelectedProject(project)
    setProjectForm({ name: project.name, description: "", status: project.status })
    setEditProjectOpen(true)
  }

  const openEditChannel = (channel: Channel) => {
    setSelectedChannel(channel)
    setChannelForm({ name: channel.name, description: "", type: channel.type })
    setEditChannelOpen(true)
  }

  const openDeleteDept = (dept: Department) => {
    setSelectedDept(dept)
    setDeleteDeptOpen(true)
  }

  const openDeleteProject = (project: Project) => {
    setSelectedProject(project)
    setDeleteProjectOpen(true)
  }

  const openDeleteChannel = (channel: Channel) => {
    setSelectedChannel(channel)
    setDeleteChannelOpen(true)
  }

  // --- Loading State Render ---
  if (isWorkspaceLoading) {
    return (
      <div className="flex flex-col h-full border-r border-sidebar-border bg-sidebar p-4 w-full">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-9 w-full mb-6" />
        
        {/* Navigation Skeleton */}
        <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
            ))}
        </div>
        <div className="mt-8 space-y-3">
             <Skeleton className="h-4 w-32 mb-2" />
             {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
            ))}
        </div>
        <div className="mt-auto pt-4 border-t">
             <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-12" />
                </div>
             </div>
        </div>
      </div>
    )
  }

  // Fallback if data is missing but not loading (error state or empty)
  if (!workspaceData) return null

  const workspace = workspaceData

  return (
    <div className="flex flex-col h-full w-full border-r border-sidebar-border bg-sidebar">
      
      {/* Workspace Header */}
      <div className="border-b border-sidebar-border p-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg text-white">
            {workspace.icon || "🏢"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base truncate">{workspace.name}</h2>
            <Badge className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-500 to-orange-500 border-none text-white">
              {workspace.plan ? workspace.plan.toUpperCase() : "FREE"}
            </Badge>
          </div>
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
              className="flex-1 justify-start h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => setDepartmentsOpen(!departmentsOpen)}
            >
              <ChevronDown className={cn("h-3 w-3 mr-2 transition-transform", !departmentsOpen && "-rotate-90")} />
              <Building2 className="h-4 w-4 mr-2" />
              Departments
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Add department"
              onClick={() => setCreateDeptOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {departmentsOpen && (
            <div className="space-y-0.5">
              {isDepartmentsLoading ? (
                 <div className="px-2 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                 </div>
              ) : (
                departments.map((dept) => (
                  <div key={dept.id} className="group flex items-center">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start h-9 px-3 hover:bg-sidebar-accent"
                      onClick={() => router.push(`/workspace/${workspaceSlug}/departments/${dept.id}`)}
                    >
                      <span className="mr-2 text-base">{dept.icon}</span>
                      <span className="flex-1 text-left text-sm truncate">{dept.name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {dept.members}
                      </div>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEditDept(dept)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Department
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/workspace/${workspaceSlug}/departments/${dept.id}/members`)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Manage Members
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDept(dept)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Department
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              className="flex-1 justify-start h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => setProjectsOpen(!projectsOpen)}
            >
              <ChevronDown className={cn("h-3 w-3 mr-2 transition-transform", !projectsOpen && "-rotate-90")} />
              <FolderKanban className="h-4 w-4 mr-2" />
              Projects
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Create project"
              onClick={() => setCreateProjectOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {projectsOpen && (
            <div className="space-y-0.5">
               {isProjectsLoading ? (
                 <div className="px-2 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                 </div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="group">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto px-3 hover:bg-sidebar-accent flex-col items-start py-2"
                      onClick={() => router.push(`/workspace/${workspaceSlug}/projects/${project.id}`)}
                    >
                      <div className="flex items-center w-full">
                        <span className="flex-1 text-left text-sm truncate">{project.name}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditProject(project)
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/workspace/${workspaceSlug}/projects/${project.id}/settings`)
                              }}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteProject(project)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="w-full mt-1">
                        <div className="h-1 bg-sidebar-accent rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Channels */}
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              className="flex-1 justify-start h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => setChannelsOpen(!channelsOpen)}
            >
              <ChevronDown className={cn("h-3 w-3 mr-2 transition-transform", !channelsOpen && "-rotate-90")} />
              <MessageSquare className="h-4 w-4 mr-2" />
              Channels
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Create channel"
              onClick={() => setCreateChannelOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {channelsOpen && (
            <div className="space-y-0.5">
               {isChannelsLoading ? (
                 <div className="px-2 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                 </div>
              ) : (
                channels.map((channel) => (
                  <div key={channel.id} className="group flex items-center">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start h-9 px-3 hover:bg-sidebar-accent"
                      onClick={() => router.push(`/workspace/${workspaceSlug}/channels/${channel.id}`)}
                    >
                      {channel.type === "private" ? (
                        <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                      ) : (
                        <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      <span className="flex-1 text-left text-sm truncate">{channel.name}</span>
                      {channel.unread > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {channel.unread}
                        </Badge>
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEditChannel(channel)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Channel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/workspace/${workspaceSlug}/channels/${channel.id}/settings`)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteChannel(channel)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Channel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
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
        <Button variant="outline" className="w-full justify-start h-10 bg-transparent border-transparent hover:bg-sidebar-accent" size="sm">
          <Avatar className="h-7 w-7 mr-2">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium truncate">John Doe</div>
            <div className="text-xs text-muted-foreground">Admin</div>
          </div>
        </Button>
      </div>

      {/* Dialogs */}
      <CreateDepartmentDialog
        open={createDeptOpen}
        onOpenChange={setCreateDeptOpen}
        workspaceId={workspaceData?.id || ""}
        onSuccess={() => {}}
      />
      <EditDepartmentDialog
        editDeptOpen={editDeptOpen}
        setEditDeptOpen={setEditDeptOpen}
        deptForm={deptForm}
        setDeptForm={setDeptForm}
        handleEditDept={handleEditDept}
      />
      <DeleteDepartmentDialog
        deleteDeptOpen={deleteDeptOpen}
        setDeleteDeptOpen={setDeleteDeptOpen}
        selectedDept={selectedDept}
        handleDeleteDept={handleDeleteDept}
      />
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        workspaceId={workspaceData?.id || ""}
        onSuccess={() => {}}
      />
      <EditProjectDialog
        editProjectOpen={editProjectOpen}
        setEditProjectOpen={setEditProjectOpen}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        handleEditProject={handleEditProject}
      />
      <DeleteProjectDialog
        deleteProjectOpen={deleteProjectOpen}
        setDeleteProjectOpen={setDeleteProjectOpen}
        selectedProject={selectedProject}
        handleDeleteProject={handleDeleteProject}
      />
      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        workspaceId={workspaceData?.id || ""}
        onSuccess={() => {}}
      />
      <EditChannelDialog
        editChannelOpen={editChannelOpen}
        setEditChannelOpen={setEditChannelOpen}
        channelForm={channelForm}
        setChannelForm={setChannelForm}
        handleEditChannel={handleEditChannel}
      />
      <DeleteChannelDialog
        deleteChannelOpen={deleteChannelOpen}
        setDeleteChannelOpen={setDeleteChannelOpen}
        selectedChannel={selectedChannel}
        handleDeleteChannel={handleDeleteChannel}
      />
    </div>
  )
}