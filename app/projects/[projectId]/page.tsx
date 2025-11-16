"use client"

import * as React from "react"
import { Calendar, Clock, Users, Target, TrendingUp, AlertTriangle, DollarSign, FileText, MoreHorizontal, Plus, CheckCircle2, Circle, XCircle, Edit, Download, ExternalLink, Layers, Share, Filter, Search, List, LayoutGrid, TableIcon } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import { DynamicHeader } from "@/components/dynamic-header"
import { TaskManagementView } from "@/components/task-management-view"
import { TaskDetailSheet } from "@/components/task-detail-sheet"
import { useParams, useRouter } from 'next/navigation'
import type { Task, Project, Milestone } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { mockUsers, mockProjects } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { ProjectInvitationDialog } from "@/components/project-invitation-dialog"
import { useProject } from "@/hooks/api/use-projects"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const { data: project, isLoading } = useProject(projectId)

  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [taskSheetOpen, setTaskSheetOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("overview")
  const [invitationDialogOpen, setInvitationDialogOpen] = React.useState(false)

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setTaskSheetOpen(true)
  }

  const handleProjectClick = (clickedProjectId: string) => {
    const clickedProject = mockProjects.find((p) => p.id === clickedProjectId)
    if (clickedProject) {
      // setSelectedProject(clickedProject)
      // setProjectSheetOpen(true)
    }
  }

  const handleChannelSelect = (channelId: string) => {
    if (channelId === "assistant") {
      router.push("/assistant")
    } else if (channelId.startsWith("project-")) {
      router.push(`/projects/${channelId}`)
    } else if (channelId.startsWith("dm-") || channelId.startsWith("task-")) {
      router.push(`/channels/${channelId}`)
    } else {
      router.push(`/channels/${channelId}`)
    }
  }

  const handleBackClick = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "closed":
        return "text-green-600 bg-green-50 dark:bg-green-950"
      case "in-progress":
      case "active":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950"
      case "upcoming":
      case "open":
        return "text-gray-600 bg-gray-50 dark:bg-gray-900"
      case "overdue":
        return "text-red-600 bg-red-50 dark:bg-red-950"
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900"
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={projectId}
        onChannelSelect={handleChannelSelect}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <DynamicHeader
          activeView={projectId}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
          onBackClick={handleBackClick}
        />

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-4xl">{project.icon}</div>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                      <p className="text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setInvitationDialogOpen(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                    <Button variant="outline">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Progress</p>
                    <p className="text-3xl font-bold">{project.progress?.progress || 0}%</p>
                    <Progress value={project.progress?.progress || 0} className="h-2 mt-2" />
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Tasks</p>
                    <p className="text-3xl font-bold">{project.progress?.totalTasks || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {project.progress?.completedTasks || 0} completed
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Team</p>
                    <p className="text-3xl font-bold">{project.members?.length || 0}</p>
                    <div className="flex -space-x-2 mt-2">
                      {project.members?.slice(0, 3).map((memberId) => {
                        const user = mockUsers.find((u) => u.id === memberId)
                        return user ? (
                          <Avatar key={memberId} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                        ) : null
                      })}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={cn("capitalize text-sm", getStatusColor(project.status))}>{project.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </p>
                  </Card>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">
                    <List className="h-4 w-4 mr-2" />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger value="board">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Board
                  </TabsTrigger>
                  <TabsTrigger value="timeline">
                    <Clock className="h-4 w-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="calendar">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="team">
                    <Users className="h-4 w-4 mr-2" />
                    Team
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Task Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold">{project.progress?.completedTasks || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                        <Circle className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">In Progress</p>
                          <p className="text-2xl font-bold">{project.progress?.inProgressTasks || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                        <Clock className="h-8 w-8 text-gray-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Upcoming</p>
                          <p className="text-2xl font-bold">{project.progress?.upcomingTasks || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950">
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Overdue</p>
                          <p className="text-2xl font-bold">{project.progress?.overdueTasks || 0}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Milestones
                      </h3>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Milestone
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {project.milestones?.slice(0, 3).map((milestone: Milestone) => (
                        <div key={milestone.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{milestone.title}</h4>
                              <p className="text-sm text-muted-foreground">{milestone.description}</p>
                            </div>
                            <Badge className={cn("capitalize", getStatusColor(milestone.status))}>{milestone.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Due: {formatDate(milestone.dueDate)}</span>
                            <span className="font-medium">{milestone.progress}%</span>
                          </div>
                          <Progress value={milestone.progress} className="h-2 mt-2" />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                      </h3>
                      <Button variant="outline" size="sm" onClick={() => setInvitationDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {project.members?.slice(0, 5).map((memberId) => {
                        const user = mockUsers.find((u) => u.id === memberId)
                        if (!user) return null
                        return (
                          <div key={memberId} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.role}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {user.status}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="tasks" className="mt-6">
                  <TaskManagementView
                    onTaskClick={(task) => {
                      setSelectedTask(task)
                      setTaskSheetOpen(true)
                    }}
                    projectId={projectId}
                  />
                </TabsContent>

                <TabsContent value="board" className="mt-6">
                  <TaskManagementView
                    onTaskClick={(task) => {
                      setSelectedTask(task)
                      setTaskSheetOpen(true)
                    }}
                    projectId={projectId}
                  />
                </TabsContent>

                <TabsContent value="timeline" className="mt-6">
                  <TaskManagementView
                    onTaskClick={(task) => {
                      setSelectedTask(task)
                      setTaskSheetOpen(true)
                    }}
                    projectId={projectId}
                  />
                </TabsContent>

                <TabsContent value="calendar" className="mt-6">
                  <TaskManagementView
                    onTaskClick={(task) => {
                      setSelectedTask(task)
                      setTaskSheetOpen(true)
                    }}
                    projectId={projectId}
                  />
                </TabsContent>

                <TabsContent value="team" className="mt-6">
                  <div className="space-y-4">
                    {project.members?.map((memberId) => {
                      const user = mockUsers.find((u) => u.id === memberId)
                      if (!user) return null
                      return (
                        <Card key={memberId} className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold text-lg">{user.name}</h4>
                                <p className="text-muted-foreground">{user.role}</p>
                                <Badge variant="outline" className="capitalize mt-1">
                                  {user.status}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="outline">View Profile</Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>
      </main>

      <TaskDetailSheet task={selectedTask} open={taskSheetOpen} onOpenChange={setTaskSheetOpen} />

      <ProjectInvitationDialog
        projectId={projectId}
        projectName={project.name}
        open={invitationDialogOpen}
        onOpenChange={setInvitationDialogOpen}
      />
    </div>
  )
}
