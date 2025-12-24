"use client"

import * as React from "react"
import { use } from "react"
import {
  TrendingUp,
  Users,
  FolderKanban,
  MessageSquare,
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Building2,
  MoreHorizontal,
  Edit,
  Trash2,
  Settings,
  Hash,
  Lock,
  UserPlus,
  Search,
  Filter,
  LayoutGrid,
  List,
  CalendarDays,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { CalendarView } from "@/components/calendar-view"
import { useToast } from "@/hooks/use-toast"

interface WorkspacePageProps {
  params: Promise<{ slug: string }>
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = use(params)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("overview")
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = React.useState("")
  const { toast } = useToast()

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

  // Mock workspace ID - in real app, fetch from API based on slug
  const workspaceId = "workspace-1"

  // Mock data - replace with actual API calls
  const stats = [
    {
      title: "Active Projects",
      value: "24",
      change: "+12%",
      icon: FolderKanban,
      trend: "up",
      description: "from last month",
    },
    { title: "Team Members", value: "142", change: "+8", icon: Users, trend: "up", description: "new this month" },
    {
      title: "Messages Today",
      value: "1,284",
      change: "+23%",
      icon: MessageSquare,
      trend: "up",
      description: "from yesterday",
    },
    {
      title: "Tasks Completed",
      value: "89%",
      change: "+5%",
      icon: CheckCircle2,
      trend: "up",
      description: "completion rate",
    },
  ]

  const [departments, setDepartments] = React.useState([
    {
      id: "dept-1",
      name: "Engineering",
      slug: "engineering",
      icon: "💻",
      color: "#3b82f6",
      members: 45,
      channels: 8,
      description: "Software development team",
    },
    {
      id: "dept-2",
      name: "Product",
      slug: "product",
      icon: "🎨",
      color: "#8b5cf6",
      members: 23,
      channels: 5,
      description: "Product management and design",
    },
    {
      id: "dept-3",
      name: "Marketing",
      slug: "marketing",
      icon: "📢",
      color: "#22c55e",
      members: 18,
      channels: 6,
      description: "Marketing and communications",
    },
    {
      id: "dept-4",
      name: "Sales",
      slug: "sales",
      icon: "💼",
      color: "#f59e0b",
      members: 32,
      channels: 7,
      description: "Sales and business development",
    },
  ])

  const [channels, setChannels] = React.useState([
    {
      id: "ch-1",
      name: "general",
      type: "public",
      unread: 5,
      members: 142,
      departmentId: null,
      description: "General workspace discussions",
    },
    {
      id: "ch-2",
      name: "announcements",
      type: "public",
      unread: 2,
      members: 142,
      departmentId: null,
      description: "Important announcements",
    },
    {
      id: "ch-3",
      name: "engineering-general",
      type: "public",
      unread: 12,
      members: 45,
      departmentId: "dept-1",
      description: "Engineering team channel",
    },
    {
      id: "ch-4",
      name: "design-reviews",
      type: "private",
      unread: 3,
      members: 12,
      departmentId: "dept-2",
      description: "Design review sessions",
    },
    {
      id: "ch-5",
      name: "sales-leads",
      type: "private",
      unread: 8,
      members: 32,
      departmentId: "dept-4",
      description: "Sales lead discussions",
    },
  ])

  const [projects, setProjects] = React.useState([
    {
      id: "proj-1",
      name: "Q1 Product Launch",
      icon: "🚀",
      status: "in-progress",
      priority: "high",
      progress: 67,
      dueDate: "2024-03-15",
      team: ["JD", "SM", "RK"],
      departmentId: "dept-2",
      tasks: 24,
      completed: 16,
    },
    {
      id: "proj-2",
      name: "Website Redesign",
      icon: "🎨",
      status: "in-progress",
      priority: "medium",
      progress: 45,
      dueDate: "2024-03-20",
      team: ["AL", "TM"],
      departmentId: "dept-1",
      tasks: 18,
      completed: 8,
    },
    {
      id: "proj-3",
      name: "Mobile App v2",
      icon: "📱",
      status: "planning",
      priority: "high",
      progress: 12,
      dueDate: "2024-04-10",
      team: ["BH", "KL", "PM"],
      departmentId: "dept-1",
      tasks: 32,
      completed: 4,
    },
    {
      id: "proj-4",
      name: "Sales Dashboard",
      icon: "📊",
      status: "in-progress",
      priority: "medium",
      progress: 82,
      dueDate: "2024-03-10",
      team: ["JW", "RC"],
      departmentId: "dept-4",
      tasks: 15,
      completed: 12,
    },
  ])

  const recentActivity = [
    { id: "1", user: "Alice Johnson", action: "completed task", target: "Update homepage design", time: "2m ago" },
    { id: "2", user: "Bob Smith", action: "commented on", target: "Q1 Roadmap", time: "15m ago" },
    { id: "3", user: "Carol White", action: "created project", target: "Customer Portal", time: "1h ago" },
    { id: "4", user: "David Brown", action: "invited", target: "3 new members", time: "2h ago" },
  ]

  // Department CRUD
  const handleCreateDepartment = () => {
    const newDept = {
      id: `dept-${Date.now()}`,
      ...deptForm,
      members: 0,
      channels: deptForm.createChannel ? 1 : 0,
    }
    setDepartments([...departments, newDept])
    if (deptForm.createChannel) {
      setChannels([
        ...channels,
        {
          id: `ch-${Date.now()}`,
          name: `${deptForm.slug}-general`,
          type: "public",
          unread: 0,
          members: 0,
          departmentId: newDept.id,
          description: `${deptForm.name} department channel`,
        },
      ])
    }
    setCreateDeptOpen(false)
    setDeptForm({ name: "", slug: "", description: "", icon: "💼", color: "#3b82f6", createChannel: true })
    toast({ title: "Department created", description: `${deptForm.name} has been created successfully.` })
  }

  const handleEditDepartment = () => {
    setDepartments(departments.map((d) => (d.id === selectedDept.id ? { ...d, ...deptForm } : d)))
    setEditDeptOpen(false)
    setSelectedDept(null)
    toast({ title: "Department updated", description: `${deptForm.name} has been updated.` })
  }

  const handleDeleteDepartment = () => {
    setDepartments(departments.filter((d) => d.id !== selectedDept.id))
    setChannels(channels.filter((c) => c.departmentId !== selectedDept.id))
    setDeleteDeptOpen(false)
    setSelectedDept(null)
    toast({ title: "Department deleted", description: "Department and associated channels have been removed." })
  }

  // Channel CRUD
  const handleCreateChannel = () => {
    const newChannel = {
      id: `ch-${Date.now()}`,
      name: channelForm.name,
      type: channelForm.type,
      unread: 0,
      members: 0,
      departmentId: channelForm.departmentId || null,
      description: channelForm.description,
    }
    setChannels([...channels, newChannel])
    setCreateChannelOpen(false)
    setChannelForm({ name: "", description: "", type: "public", departmentId: "" })
    toast({ title: "Channel created", description: `#${channelForm.name} has been created.` })
  }

  const handleEditChannel = () => {
    setChannels(channels.map((c) => (c.id === selectedChannel.id ? { ...c, ...channelForm } : c)))
    setEditChannelOpen(false)
    setSelectedChannel(null)
    toast({ title: "Channel updated", description: `#${channelForm.name} has been updated.` })
  }

  const handleDeleteChannel = () => {
    setChannels(channels.filter((c) => c.id !== selectedChannel.id))
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
    // setProjects([...projects, newProject])
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
    setProjects(
      projects.map((p) =>
        p.id === selectedProject.id
          ? {
              ...p,
              name: projectForm.name,
              icon: projectForm.icon,
              status: projectForm.status,
              priority: projectForm.priority,
              dueDate: projectForm.endDate,
              departmentId: projectForm.departmentId,
            }
          : p,
      ),
    )
    setEditProjectOpen(false)
    setSelectedProject(null)
    toast({ title: "Project updated", description: `${projectForm.name} has been updated.` })
  }

  const handleDeleteProject = () => {
    setProjects(projects.filter((p) => p.id !== selectedProject.id))
    setDeleteProjectOpen(false)
    setSelectedProject(null)
    toast({ title: "Project deleted", description: "Project has been removed." })
  }

  const filteredDepartments = departments.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredChannels = channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const iconOptions = ["💼", "💻", "🎨", "📢", "📊", "🚀", "📱", "🔧", "📁", "🎯", "💡", "🔒"]
  const colorOptions = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"]

  return (
    <>
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Workspace Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your workspace resources</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button size="sm">
            <Activity className="h-4 w-4 mr-2" />
            View Activity
          </Button>
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
              <TabsTrigger value="departments" className="gap-2">
                <Building2 className="h-4 w-4" />
                Departments
              </TabsTrigger>
              <TabsTrigger value="channels" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 m-0">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
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
                {/* Recent Projects */}
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
                    {projects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{project.icon}</span>
                              <h4 className="font-semibold text-sm">{project.name}</h4>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due {project.dueDate}
                              </span>
                              <Badge
                                variant={project.status === "in-progress" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {project.status}
                              </Badge>
                              <Badge
                                variant={project.priority === "high" ? "destructive" : "outline"}
                                className="text-xs"
                              >
                                {project.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex -space-x-2">
                            {project.team.map((member, idx) => (
                              <Avatar key={idx} className="h-7 w-7 border-2 border-background">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {member}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {project.completed}/{project.tasks} tasks
                            </span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from your team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {activity.user
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{activity.user}</span>{" "}
                              <span className="text-muted-foreground">{activity.action}</span>{" "}
                              <span className="font-medium">{activity.target}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="p-6 m-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Departments</h2>
                  <p className="text-sm text-muted-foreground">Organize your workspace by departments</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  >
                    {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  </Button>
                  <Dialog open={createDeptOpen} onOpenChange={setCreateDeptOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Department
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Department</DialogTitle>
                        <DialogDescription>Add a new department to your workspace</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="col-span-3 space-y-2">
                            <Label>Name</Label>
                            <Input
                              value={deptForm.name}
                              onChange={(e) =>
                                setDeptForm({
                                  ...deptForm,
                                  name: e.target.value,
                                  slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                                })
                              }
                              placeholder="Engineering"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Icon</Label>
                            <Select value={deptForm.icon} onValueChange={(v) => setDeptForm({ ...deptForm, icon: v })}>
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
                        <div className="space-y-2">
                          <Label>Slug</Label>
                          <Input
                            value={deptForm.slug}
                            onChange={(e) => setDeptForm({ ...deptForm, slug: e.target.value })}
                            placeholder="engineering"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={deptForm.description}
                            onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                            placeholder="Department description..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <div className="flex gap-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color}
                                className={`h-8 w-8 rounded-full border-2 ${deptForm.color === color ? "border-foreground" : "border-transparent"}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setDeptForm({ ...deptForm, color })}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={deptForm.createChannel}
                            onCheckedChange={(c) => setDeptForm({ ...deptForm, createChannel: c })}
                          />
                          <Label>Create department channel</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDeptOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateDepartment}>Create Department</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}
              >
                {filteredDepartments.map((dept) => (
                  <Card key={dept.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: dept.color + "20" }}
                          >
                            {dept.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{dept.name}</CardTitle>
                            <CardDescription className="text-xs">/{dept.slug}</CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDept(dept)
                                setDeptForm({
                                  name: dept.name,
                                  slug: dept.slug,
                                  description: dept.description,
                                  icon: dept.icon,
                                  color: dept.color,
                                  createChannel: false,
                                })
                                setEditDeptOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Members
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedDept(dept)
                                setDeleteDeptOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{dept.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {dept.members}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {dept.channels}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Channels Tab */}
            <TabsContent value="channels" className="p-6 m-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Channels</h2>
                  <p className="text-sm text-muted-foreground">Communication channels in your workspace</p>
                </div>
                <Dialog open={createChannelOpen} onOpenChange={setCreateChannelOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Channel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Channel</DialogTitle>
                      <DialogDescription>Add a new channel to your workspace</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Channel Name</Label>
                        <Input
                          value={channelForm.name}
                          onChange={(e) =>
                            setChannelForm({
                              ...channelForm,
                              name: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                            })
                          }
                          placeholder="general"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={channelForm.description}
                          onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                          placeholder="What is this channel about?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={channelForm.type}
                          onValueChange={(v) => setChannelForm({ ...channelForm, type: v })}
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
                      <div className="space-y-2">
                        <Label>Department (optional)</Label>
                        <Select
                          value={channelForm.departmentId || "none"}
                          onValueChange={(v) => setChannelForm({ ...channelForm, departmentId: v === "none" ? "" : v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.icon} {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateChannelOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateChannel}>Create Channel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        {channel.type === "private" ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Hash className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{channel.name}</h4>
                          {channel.unread > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {channel.unread} new
                            </Badge>
                          )}
                          {channel.departmentId && (
                            <Badge variant="outline" className="text-xs">
                              {departments.find((d) => d.id === channel.departmentId)?.icon}{" "}
                              {departments.find((d) => d.id === channel.departmentId)?.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {channel.members}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedChannel(channel)
                              setChannelForm({
                                name: channel.name,
                                description: channel.description,
                                type: channel.type,
                                departmentId: channel.departmentId || "",
                              })
                              setEditChannelOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Members
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedChannel(channel)
                              setDeleteChannelOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="p-6 m-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Projects</h2>
                  <p className="text-sm text-muted-foreground">Manage workspace projects</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  >
                    {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  </Button>
                  <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create Project</DialogTitle>
                        <DialogDescription>Start a new project in your workspace</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="col-span-3 space-y-2">
                            <Label>Project Name</Label>
                            <Input
                              value={projectForm.name}
                              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                              placeholder="Q1 Product Launch"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Icon</Label>
                            <Select
                              value={projectForm.icon}
                              onValueChange={(v) => setProjectForm({ ...projectForm, icon: v })}
                            >
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
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={projectForm.description}
                            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                            placeholder="Project description..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={projectForm.status}
                              onValueChange={(v) => setProjectForm({ ...projectForm, status: v })}
                            >
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
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                              type="date"
                              value={projectForm.startDate}
                              onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                              type="date"
                              value={projectForm.endDate}
                              onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Select
                            value={projectForm.departmentId || "none"}
                            onValueChange={(v) =>
                              setProjectForm({ ...projectForm, departmentId: v === "none" ? "" : v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.icon} {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateProjectOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateProject}>Create Project</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}
              >
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                            {project.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{project.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={project.status === "in-progress" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {project.status}
                              </Badge>
                              <Badge
                                variant={project.priority === "high" ? "destructive" : "outline"}
                                className="text-xs"
                              >
                                {project.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProject(project)
                                setProjectForm({
                                  name: project.name,
                                  description: "",
                                  icon: project.icon,
                                  status: project.status,
                                  priority: project.priority,
                                  startDate: "",
                                  endDate: project.dueDate,
                                  departmentId: project.departmentId || "",
                                })
                                setEditProjectOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Members
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedProject(project)
                                setDeleteProjectOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {project.dueDate}
                        </span>
                        {project.departmentId && (
                          <Badge variant="outline" className="text-xs">
                            {departments.find((d) => d.id === project.departmentId)?.icon}{" "}
                            {departments.find((d) => d.id === project.departmentId)?.name}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {project.completed}/{project.tasks} tasks
                          </span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex -space-x-2">
                          {project.team.map((member, idx) => (
                            <Avatar key={idx} className="h-7 w-7 border-2 border-background">
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {member}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="p-0 m-0 h-full">
              <CalendarView />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* All Dialogs */}
      {/* Edit Department Dialog */}
      <Dialog open={editDeptOpen} onOpenChange={setEditDeptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Name</Label>
                <Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={deptForm.icon} onValueChange={(v) => setDeptForm({ ...deptForm, icon: v })}>
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
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`h-8 w-8 rounded-full border-2 ${deptForm.color === color ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setDeptForm({ ...deptForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDeptOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDepartment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      <AlertDialog open={deleteDeptOpen} onOpenChange={setDeleteDeptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the department and all associated channels. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
