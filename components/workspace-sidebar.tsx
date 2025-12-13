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
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Hash,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  useWorkspace,
  useWorkspaceDepartments,
  useWorkspaceProjects,
  useWorkspaceChannels,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useCreateWorkspaceProject,
  useUpdateWorkspaceProject,
  useDeleteWorkspaceProject,
  useCreateWorkspaceChannel,
  useUpdateWorkspaceChannel,
  useDeleteWorkspaceChannel,
} from "@/hooks/api/use-workspaces"

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

// Dialog Props Interfaces
interface CreateDeptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deptForm: { name: string; icon: string; description: string }
  setDeptForm: React.Dispatch<React.SetStateAction<{ name: string; icon: string; description: string }>>
  handleCreateDept: () => Promise<void>
}

interface EditDeptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deptForm: { name: string; icon: string; description: string }
  setDeptForm: React.Dispatch<React.SetStateAction<{ name: string; icon: string; description: string }>>
  handleEditDept: () => Promise<void>
}

interface DeleteDeptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDept: Department | null
  handleDeleteDept: () => Promise<void>
}

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectForm: { name: string; description: string; status: string }
  setProjectForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; status: string }>>
  handleCreateProject: () => Promise<void>
}

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectForm: { name: string; description: string; status: string }
  setProjectForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; status: string }>>
  handleEditProject: () => Promise<void>
}

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProject: Project | null
  handleDeleteProject: () => Promise<void>
}

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelForm: { name: string; description: string; type: "public" | "private" }
  setChannelForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; type: "public" | "private" }>>
  handleCreateChannel: () => Promise<void>
}

interface EditChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelForm: { name: string; description: string; type: "public" | "private" }
  setChannelForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; type: "public" | "private" }>>
  handleEditChannel: () => Promise<void>
}

interface DeleteChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedChannel: Channel | null
  handleDeleteChannel: () => Promise<void>
}

export function WorkspaceSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter()
  const { toast } = useToast()
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

  const { data: workspaceData } = useWorkspace(workspaceSlug)
  const { data: departmentsData } = useWorkspaceDepartments(workspaceData?.id || "")
  const { data: projectsData } = useWorkspaceProjects(workspaceData?.id || "")
  const { data: channelsData } = useWorkspaceChannels(workspaceData?.id || "")

  const createDepartment = useCreateDepartment(workspaceData?.id || "")
  const updateDepartment = useUpdateDepartment(workspaceData?.id || "")
  const deleteDepartment = useDeleteDepartment(workspaceData?.id || "")

  const createProject = useCreateWorkspaceProject(workspaceData?.id || "")
  const updateProject = useUpdateWorkspaceProject(workspaceData?.id || "")
  const deleteProject = useDeleteWorkspaceProject(workspaceData?.id || "")

  const createChannel = useCreateWorkspaceChannel(workspaceData?.id || "")
  const updateChannel = useUpdateWorkspaceChannel(workspaceData?.id || "")
  const deleteChannel = useDeleteWorkspaceChannel(workspaceData?.id || "")

  const workspace = workspaceData || {
    name: "Loading...",
    icon: "🏢",
    plan: "enterprise",
  }

  const departments = Array.isArray(departmentsData) ? departmentsData : []
  const projects = Array.isArray(projectsData) ? projectsData : []
  const channels = Array.isArray(channelsData) ? channelsData : []

  const handleCreateDept = async () => {
    try {
      await createDepartment.mutateAsync({
        name: deptForm.name,
        slug: deptForm.name.toLowerCase().replace(/\s+/g, "-"),
        description: deptForm.description,
        icon: deptForm.icon,
        createChannel: true,
      })
      setCreateDeptOpen(false)
      setDeptForm({ name: "", icon: "💼", description: "" })
      toast({ title: "Department created", description: `${deptForm.name} has been created successfully.` })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create department", variant: "destructive" })
    }
  }

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

  const handleCreateProject = async () => {
    try {
      await createProject.mutateAsync({
        name: projectForm.name,
        description: projectForm.description,
        status: projectForm.status as any,
      })
      setCreateProjectOpen(false)
      setProjectForm({ name: "", description: "", status: "planning" })
      toast({ title: "Project created", description: `${projectForm.name} has been created successfully.` })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" })
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

  const handleCreateChannel = async () => {
    try {
      await createChannel.mutateAsync({
        name: channelForm.name.toLowerCase().replace(/\s+/g, "-"),
        description: channelForm.description,
        type: channelForm.type as "public" | "private",
      })
      setCreateChannelOpen(false)
      setChannelForm({ name: "", description: "", type: "public" })
      toast({ title: "Channel created", description: `#${channelForm.name} has been created successfully.` })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create channel", variant: "destructive" })
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

  // Open edit dialog with selected item data
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

  return (
    <div className="w-72 bg-sidebar-accent border-r border-sidebar-border flex flex-col">
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
              {departments.map((dept) => (
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
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
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
              {projects.map((project) => (
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
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
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
              {channels.map((channel) => (
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
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
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

      {/* Dialogs */}
      <CreateDeptDialog
        open={createDeptOpen}
        onOpenChange={setCreateDeptOpen}
        deptForm={deptForm}
        setDeptForm={setDeptForm}
        handleCreateDept={handleCreateDept}
      />
      
      <EditDeptDialog
        open={editDeptOpen}
        onOpenChange={setEditDeptOpen}
        deptForm={deptForm}
        setDeptForm={setDeptForm}
        handleEditDept={handleEditDept}
      />
      
      <DeleteDeptDialog
        open={deleteDeptOpen}
        onOpenChange={setDeleteDeptOpen}
        selectedDept={selectedDept}
        handleDeleteDept={handleDeleteDept}
      />
      
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        handleCreateProject={handleCreateProject}
      />
      
      <EditProjectDialog
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        handleEditProject={handleEditProject}
      />
      
      <DeleteProjectDialog
        open={deleteProjectOpen}
        onOpenChange={setDeleteProjectOpen}
        selectedProject={selectedProject}
        handleDeleteProject={handleDeleteProject}
      />
      
      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        channelForm={channelForm}
        setChannelForm={setChannelForm}
        handleCreateChannel={handleCreateChannel}
      />
      
      <EditChannelDialog
        open={editChannelOpen}
        onOpenChange={setEditChannelOpen}
        channelForm={channelForm}
        setChannelForm={setChannelForm}
        handleEditChannel={handleEditChannel}
      />
      
      <DeleteChannelDialog
        open={deleteChannelOpen}
        onOpenChange={setDeleteChannelOpen}
        selectedChannel={selectedChannel}
        handleDeleteChannel={handleDeleteChannel}
      />
    </div>
  )
}

// Create Department Dialog
const CreateDeptDialog: React.FC<CreateDeptDialogProps> = ({
  open,
  onOpenChange,
  deptForm,
  setDeptForm,
  handleCreateDept,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Department</DialogTitle>
        <DialogDescription>Add a new department to your workspace.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Department Name</Label>
          <Input
            placeholder="e.g., Engineering, Marketing"
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Icon</Label>
          <Select value={deptForm.icon} onValueChange={(v) => setDeptForm({ ...deptForm, icon: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="💼">💼 Business</SelectItem>
              <SelectItem value="💻">💻 Engineering</SelectItem>
              <SelectItem value="🎨">🎨 Design</SelectItem>
              <SelectItem value="📢">📢 Marketing</SelectItem>
              <SelectItem value="💰">💰 Finance</SelectItem>
              <SelectItem value="🤝">🤝 HR</SelectItem>
              <SelectItem value="📊">📊 Analytics</SelectItem>
              <SelectItem value="🔧">🔧 Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Textarea
            placeholder="Describe the department's purpose..."
            value={deptForm.description}
            onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleCreateDept} disabled={!deptForm.name}>
          Create Department
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Edit Department Dialog
const EditDeptDialog: React.FC<EditDeptDialogProps> = ({
  open,
  onOpenChange,
  deptForm,
  setDeptForm,
  handleEditDept,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Department</DialogTitle>
        <DialogDescription>Update department information.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Department Name</Label>
          <Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Icon</Label>
          <Select value={deptForm.icon} onValueChange={(v) => setDeptForm({ ...deptForm, icon: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="💼">💼 Business</SelectItem>
              <SelectItem value="💻">💻 Engineering</SelectItem>
              <SelectItem value="🎨">🎨 Design</SelectItem>
              <SelectItem value="📢">📢 Marketing</SelectItem>
              <SelectItem value="💰">💰 Finance</SelectItem>
              <SelectItem value="🤝">🤝 HR</SelectItem>
              <SelectItem value="📊">📊 Analytics</SelectItem>
              <SelectItem value="🔧">🔧 Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleEditDept}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Delete Department Dialog
const DeleteDeptDialog: React.FC<DeleteDeptDialogProps> = ({
  open,
  onOpenChange,
  selectedDept,
  handleDeleteDept,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Department</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{selectedDept?.name}"? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDeleteDept}>
          Delete Department
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Create Project Dialog
const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
  projectForm,
  setProjectForm,
  handleCreateProject,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Project</DialogTitle>
        <DialogDescription>Start a new project in your workspace.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input
            placeholder="e.g., Q1 Product Launch"
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={projectForm.status} onValueChange={(v) => setProjectForm({ ...projectForm, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Textarea
            placeholder="Describe the project..."
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleCreateProject} disabled={!projectForm.name}>
          Create Project
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Edit Project Dialog
const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  open,
  onOpenChange,
  projectForm,
  setProjectForm,
  handleEditProject,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogDescription>Update project information.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={projectForm.status} onValueChange={(v) => setProjectForm({ ...projectForm, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleEditProject}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Delete Project Dialog
const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  open,
  onOpenChange,
  selectedProject,
  handleDeleteProject,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{selectedProject?.name}"? All tasks and data will be lost.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDeleteProject}>
          Delete Project
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Create Channel Dialog
const CreateChannelDialog: React.FC<CreateChannelDialogProps> = ({
  open,
  onOpenChange,
  channelForm,
  setChannelForm,
  handleCreateChannel,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Channel</DialogTitle>
        <DialogDescription>Add a new communication channel.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Channel Name</Label>
          <Input
            placeholder="e.g., general, announcements"
            value={channelForm.name}
            onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Channel Type</Label>
          <Select
            value={channelForm.type}
            onValueChange={(v: "public" | "private") => setChannelForm({ ...channelForm, type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Public - Anyone can join
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Private - Invite only
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Textarea
            placeholder="What is this channel about?"
            value={channelForm.description}
            onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleCreateChannel} disabled={!channelForm.name}>
          Create Channel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Edit Channel Dialog
const EditChannelDialog: React.FC<EditChannelDialogProps> = ({
  open,
  onOpenChange,
  channelForm,
  setChannelForm,
  handleEditChannel,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Channel</DialogTitle>
        <DialogDescription>Update channel settings.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Channel Name</Label>
          <Input value={channelForm.name} onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Channel Type</Label>
          <Select
            value={channelForm.type}
            onValueChange={(v: "public" | "private") => setChannelForm({ ...channelForm, type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleEditChannel}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Delete Channel Dialog
const DeleteChannelDialog: React.FC<DeleteChannelDialogProps> = ({
  open,
  onOpenChange,
  selectedChannel,
  handleDeleteChannel,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Channel</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "#{selectedChannel?.name}"? All messages will be lost.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDeleteChannel}>
          Delete Channel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)