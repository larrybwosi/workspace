"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  Users,
  FolderKanban,
  MessageSquare,
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  FileText,
  Plus,
  LayoutGrid,
  CalendarDays,
  Lock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarView } from "@/components/features/calendar/calendar-view"
import { useToast } from "@/hooks/use-toast"
import { useWorkspace, useWorkspaceMembers, useWorkspaceAnalytics } from "@/hooks/api/use-workspaces"
import { useChannels } from "@/hooks/api/use-channels"
import { useProjects } from "@/hooks/api/use-projects"

interface WorkspacePageProps {
  params: Promise<{ slug: string }>
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("overview")
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = React.useState("")
  const { toast } = useToast()

  const workspace = useWorkspace(slug).data
  const workspaceId = workspace?.id

  const { data: membersData, isLoading: membersLoading } = useWorkspaceMembers(workspaceId || "")
  const { data: channelsData, isLoading: channelsLoading } = useChannels()
  const { data: projectsData, isLoading: projectsLoading } = useProjects()
  const { data: analytics } = useWorkspaceAnalytics(workspaceId || "")

  const members = Array.isArray(membersData) ? membersData : []
  const channels = Array.isArray(channelsData) ? channelsData.filter((c: any) => c.workspaceId === workspaceId) : []
  const projects = Array.isArray(projectsData) ? projectsData.filter((p: any) => p.workspaceId === workspaceId) : []

  // Department state
  const [createDeptOpen, setCreateDeptOpen] = React.useState(false)
  const [editDeptOpen, setEditDeptOpen] = React.useState(false)
  const [deleteDeptOpen, setDeleteDeptOpen] = React.useState(false)
  const [selectedDept, setSelectedDept] = React.useState<any>(null)
  const [deptForm, setDeptForm] = React.useState({
    name: "",
    slug: "",
    description: "",
    icon: "💼",
    color: "#3b82f6",
    createChannel: true,
  })

  // Channel state
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false)
  const [editChannelOpen, setEditChannelOpen] = React.useState(false)
  const [deleteChannelOpen, setDeleteChannelOpen] = React.useState(false)
  const [selectedChannel, setSelectedChannel] = React.useState<any>(null)
  const [channelForm, setChannelForm] = React.useState({
    name: "",
    description: "",
    type: "public",
    departmentId: "",
  })

  // Project state
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false)
  const [editProjectOpen, setEditProjectOpen] = React.useState(false)
  const [deleteProjectOpen, setDeleteProjectOpen] = React.useState(false)
  const [selectedProject, setSelectedProject] = React.useState<any>(null)
  const [projectForm, setProjectForm] = React.useState({
    name: "",
    description: "",
    icon: "📁",
    status: "planning",
    priority: "medium",
    startDate: "",
    endDate: "",
    departmentId: "",
  })

  const stats = [
    {
      title: "Active Projects",
      value: projects.length.toString(),
      change: "+12%",
      icon: FolderKanban,
      trend: "up" as const,
      description: "in workspace",
    },
    {
      title: "Team Members",
      value: members.length.toString(),
      change: `+${analytics?.newMembers || 0}`,
      icon: Users,
      trend: "up" as const,
      description: "this month",
    },
    {
      title: "Channels",
      value: channels.length.toString(),
      change: "+3",
      icon: MessageSquare,
      trend: "up" as const,
      description: "active channels",
    },
    {
      title: "Completion Rate",
      value: `${analytics?.completionRate || 85}%`,
      change: "+5%",
      icon: CheckCircle2,
      trend: "up" as const,
      description: "overall progress",
    },
  ]
  const recentActivity = analytics?.recentActivity || []
  // console.log("Recent Activity:", recentActivity)


  const handleEditChannel = () => {
    // setChannels(channels.map((c) => (c.id === selectedChannel.id ? { ...c, ...channelForm } : c))) // REMOVED
    setEditChannelOpen(false)
    setSelectedChannel(null)
    toast({ title: "Channel updated", description: `#${channelForm.name} has been updated.` })
  }

  const handleDeleteChannel = () => {
    // setChannels(channels.filter((c) => c.id !== selectedChannel.id)) // REMOVED
    setDeleteChannelOpen(false)
    setSelectedChannel(null)
    toast({ title: "Channel deleted", description: "Channel has been removed." })
  }

  // Project CRUD
  const handleCreateProject = () => {
    const newProject = {
      id: `proj-${Date.now()}`,
      name: projectForm.name,
      icon: projectForm.icon,
      status: projectForm.status,
      priority: projectForm.priority,
      progress: 0,
      dueDate: projectForm.endDate,
      team: [],
      departmentId: projectForm.departmentId || null,
      tasks: 0,
      completed: 0,
    }
    // setProjects([...projects, newProject]) // REMOVED
    setCreateProjectOpen(false)
    setProjectForm({
      name: "",
      description: "",
      icon: "📁",
      status: "planning",
      priority: "medium",
      startDate: "",
      endDate: "",
      departmentId: "",
    })
    toast({ title: "Project created", description: `${projectForm.name} has been created.` })
  }

  const handleEditProject = () => {
    // setProjects( // REMOVED
    //   projects.map((p) =>
    //     p.id === selectedProject.id
    //       ? {
    //           ...p,
    //           name: projectForm.name,
    //           icon: projectForm.icon,
    //           status: projectForm.status,
    //           priority: projectForm.priority,
    //           dueDate: projectForm.endDate,
    //           departmentId: projectForm.departmentId,
    //         }
    //       : p,
    //   ),
    // )
    setEditProjectOpen(false)
    setSelectedProject(null)
    toast({ title: "Project updated", description: `${projectForm.name} has been updated.` })
  }

  const handleDeleteProject = () => {
    // setProjects(projects.filter((p) => p.id !== selectedProject.id)) // REMOVED
    setDeleteProjectOpen(false)
    setSelectedProject(null)
    toast({ title: "Project deleted", description: "Project has been removed." })
  }

  // const filteredDepartments = departments.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase())) // REMOVED
  // const filteredChannels = channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())) // REMOVED - REPLACED WITH REAL DATA FETCHING
  // const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())) // REMOVED - REPLACED WITH REAL DATA FETCHING

  const filteredChannels = channels.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredProjects = projects.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredMembers = members.filter((m: any) => m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()))

  const iconOptions = ["💼", "💻", "🎨", "📢", "📊", "🚀", "📱", "🔧", "📁", "🎯", "💡", "🔒"]
  const colorOptions = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"]

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Workspace not found</h2>
          <p className="text-muted-foreground mb-4">The workspace you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              {workspace.icon && <span className="text-3xl">{workspace.icon}</span>}
              <div>
                <h1 className="text-2xl font-bold">{workspace.name}</h1>
                <p className="text-sm text-muted-foreground">{workspace.description || "Workspace overview"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search workspace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="sm" onClick={() => router.push(`/workspace/${slug}/calendar`)}>
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button size="sm" onClick={() => router.push(`/workspace/${slug}/settings`)}>
              <Activity className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Overview
              </TabsTrigger>
              {/* <TabsTrigger value="departments" className="gap-2"> // REMOVED
                <Building2 className="h-4 w-4" />
                Departments
              </TabsTrigger> */}
              {/* <TabsTrigger value="channels" className="gap-2"> // REMOVED - UPDATED BELOW
                <MessageSquare className="h-4 w-4" />
                Channels
              </TabsTrigger> */}
              <TabsTrigger value="projects" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects ({projects.length})
              </TabsTrigger>
              <TabsTrigger value="channels" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Channels ({channels.length})
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 m-0 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <Card key={stat.title} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                        <span className="text-green-500 font-medium">{stat.change}</span>
                        <span className="ml-1">{stat.description}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Projects */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Active Projects</CardTitle>
                        <CardDescription>Track progress across your workspace</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("projects")}>
                        View All <ArrowUpRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {projectsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
                    ) : projects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No projects yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 bg-transparent"
                          onClick={() => router.push(`/workspace/${slug}/projects`)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Project
                        </Button>
                      </div>
                    ) : (
                      projects.slice(0, 5).map((project: any) => (
                        <div
                          key={project.id}
                          className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{project.icon || "📁"}</span>
                                <h4 className="font-semibold text-sm">{project.name}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                            </div>
                            <Badge variant={project.status === "active" ? "default" : "secondary"}>
                              {project.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{project.progress || 0}%</span>
                            </div>
                            <Progress value={project.progress || 0} className="h-2" />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>What's happening in your workspace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {/* {recentActivity?.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No recent activity</p>
                          </div>
                        ) : (
                          recentActivity?.map((activity: any) => (
                            <div key={activity.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={activity.user?.image || "/placeholder.svg"} />
                                <AvatarFallback>{activity.user?.name?.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                  <span className="font-medium">{activity.user?.name}</span>{" "}
                                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                                  <span className="font-medium">{activity.target}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                              </div>
                            </div>
                          ))
                        )} */}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common workspace tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4 bg-transparent"
                      onClick={() => router.push(`/workspace/${slug}/projects`)}
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-sm">New Project</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4 bg-transparent"
                      onClick={() => router.push(`/workspace/${slug}/channels`)}
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-sm">New Channel</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4 bg-transparent"
                      onClick={() => router.push(`/workspace/${slug}/members`)}
                    >
                      <Users className="h-5 w-5" />
                      <span className="text-sm">Invite Members</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4 bg-transparent"
                      onClick={() => router.push(`/workspace/${slug}/notes`)}
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-sm">New Note</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Departments Tab - REMOVED */}
            {/* <TabsContent value="departments" className="p-6 m-0"> */}
            {/*   ... */}
            {/* </TabsContent> */}

            {/* Channels Tab */}
            <TabsContent value="channels" className="p-6 m-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Channels</h2>
                  <p className="text-muted-foreground">Workspace communication channels</p>
                </div>
                <Button onClick={() => router.push(`/workspace/${slug}/channels`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Channel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChannels.map((channel: any) => (
                  <Card
                    key={channel.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/workspace/${slug}/channels/${channel.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {channel.type === "private" ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          #{channel.name}
                        </CardTitle>
                        <Badge variant={channel.type === "private" ? "secondary" : "default"}>{channel.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{channel.description || "No description"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{channel._count?.members || 0} members</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="p-6 m-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Members</h2>
                  <p className="text-muted-foreground">Workspace team members</p>
                </div>
                <Button onClick={() => router.push(`/workspace/${slug}/members`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {membersLoading ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No members found</p>
                  </div>
                ) : (
                  filteredMembers.map((member: any) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.user?.image || "/placeholder.svg"} />
                            <AvatarFallback>{member.user?.name?.slice(0, 2) || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{member.user?.name || "Unknown"}</h4>
                            <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                          </div>
                          <Badge>{member.role}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="p-6 m-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Notes</h2>
                  <p className="text-muted-foreground">Workspace shared notes</p>
                </div>
                <Button onClick={() => router.push(`/workspace/${slug}/notes`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </div>

              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Notes feature coming soon</p>
                <p className="text-sm mb-4">Create and share notes within your workspace</p>
                <Button variant="outline" onClick={() => router.push(`/workspace/${slug}/notes`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Note
                </Button>
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="p-6 m-0">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Workspace Calendar</h2>
                <p className="text-muted-foreground">Schedule and track workspace events</p>
              </div>
              <CalendarView />
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="p-6 m-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Projects</h2>
                  <p className="text-muted-foreground">Manage workspace projects</p>
                </div>
                <Button onClick={() => router.push(`/workspace/${slug}/projects`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project: any) => (
                  <Card
                    key={project.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{project.icon || "📁"}</span>
                          <CardTitle className="text-base">{project.name}</CardTitle>
                        </div>
                        <Badge>{project.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description || "No description"}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* All Dialogs */}
      {/* Edit Department Dialog - REMOVED */}
      {/* <Dialog open={editDeptOpen} onOpenChange={setEditDeptOpen}> */}
      {/*   ... */}
      {/* </Dialog> */}

      {/* Edit Channel Dialog */}
      <Dialog open={editChannelOpen} onOpenChange={setEditChannelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Channel Name</Label>
              <Input
                value={channelForm.name}
                onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={channelForm.description}
                onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={channelForm.type} onValueChange={(v) => setChannelForm({ ...channelForm, type: v })}>
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
            <Button variant="outline" onClick={() => setEditChannelOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditChannel}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={projectForm.icon} onValueChange={(v) => setProjectForm({ ...projectForm, icon: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Priority</Label>
                <Select
                  value={projectForm.priority}
                  onValueChange={(v) => setProjectForm({ ...projectForm, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={projectForm.endDate}
                onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProject}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      {/* <AlertDialog open={deleteDeptOpen} onOpenChange={setDeleteDeptOpen}> // REMOVED */}
      {/*   ... */}
      {/* </AlertDialog> */}

      <AlertDialog open={deleteChannelOpen} onOpenChange={setDeleteChannelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the channel and all messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChannel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all associated tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
