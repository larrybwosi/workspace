"use client"

import * as React from "react"
import { Calendar, Clock, Users, Target, TrendingUp, AlertTriangle, DollarSign, FileText, MoreHorizontal, Plus, CheckCircle2, Circle, XCircle, Edit, Download, ExternalLink, Layers } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import type { Project, Milestone } from "@/lib/types"
import { mockUsers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { ProjectInvitationDialog } from "./project-invitation-dialog"

interface ProjectFile {
  id: string
  name: string
  type: string
  url: string
  size: string
  uploadedBy: string
  uploadedAt: Date
}

interface Risk {
  id: string
  title: string
  description: string
  impact: "low" | "medium" | "high"
  probability: "low" | "medium" | "high"
  status: "open" | "mitigated" | "closed"
  mitigation: string
  owner: string
}

interface BudgetItem {
  id: string
  category: string
  allocated: number
  spent: number
  remaining: number
}

interface Resource {
  id: string
  userId: string
  role: string
  allocation: number
  startDate: Date
  endDate?: Date
}

interface ProjectDetailSheetProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectDetailSheet({ project, open, onOpenChange }: ProjectDetailSheetProps) {
  const [activeTab, setActiveTab] = React.useState("overview")
  const [editMode, setEditMode] = React.useState(false)
  const [invitationDialogOpen, setInvitationDialogOpen] = React.useState(false)

  const [milestones, setMilestones] = React.useState<Milestone[]>([
    {
      id: "milestone-1",
      title: "Project Kickoff & Requirements",
      description: "Complete initial requirements gathering and project setup",
      dueDate: new Date(2024, 0, 15),
      status: "completed",
      tasks: ["task-1", "task-2"],
      progress: 100,
    },
    {
      id: "milestone-2",
      title: "Design Phase",
      description: "Complete all design wireframes and mockups",
      dueDate: new Date(2024, 1, 28),
      status: "in-progress",
      tasks: ["task-3", "task-4", "task-5"],
      progress: 65,
    },
    {
      id: "milestone-3",
      title: "Development Sprint 1",
      description: "Implement core functionality and features",
      dueDate: new Date(2024, 2, 31),
      status: "upcoming",
      tasks: ["task-6", "task-7"],
      progress: 0,
    },
  ])

  const [risks] = React.useState<Risk[]>([
    {
      id: "risk-1",
      title: "Resource Availability",
      description: "Key team members may become unavailable during peak development phase",
      impact: "high",
      probability: "medium",
      status: "open",
      mitigation: "Cross-train team members and maintain backup resources",
      owner: "user-1",
    },
    {
      id: "risk-2",
      title: "Technology Learning Curve",
      description: "Team needs time to learn new framework",
      impact: "medium",
      probability: "high",
      status: "mitigated",
      mitigation: "Scheduled training sessions and allocated learning time",
      owner: "user-2",
    },
  ])

  const [budget] = React.useState<BudgetItem[]>([
    { id: "1", category: "Development", allocated: 50000, spent: 32000, remaining: 18000 },
    { id: "2", category: "Design", allocated: 20000, spent: 18500, remaining: 1500 },
    { id: "3", category: "Marketing", allocated: 15000, spent: 5000, remaining: 10000 },
    { id: "4", category: "Infrastructure", allocated: 10000, spent: 8000, remaining: 2000 },
  ])

  const [resources] = React.useState<Resource[]>([
    {
      id: "res-1",
      userId: "user-1",
      role: "Project Manager",
      allocation: 100,
      startDate: new Date(2024, 0, 1),
    },
    { id: "res-2", userId: "user-2", role: "Lead Designer", allocation: 100, startDate: new Date(2024, 0, 5) },
    { id: "res-3", userId: "user-3", role: "Frontend Developer", allocation: 80, startDate: new Date(2024, 0, 10) },
    { id: "res-4", userId: "user-4", role: "Backend Developer", allocation: 75, startDate: new Date(2024, 0, 10) },
  ])

  const [files] = React.useState<ProjectFile[]>([
    {
      id: "file-1",
      name: "Project Brief.pdf",
      type: "application/pdf",
      url: "#",
      size: "2.3 MB",
      uploadedBy: "user-1",
      uploadedAt: new Date(2024, 0, 5),
    },
    {
      id: "file-2",
      name: "Design Mockups.fig",
      type: "figma",
      url: "#",
      size: "15.7 MB",
      uploadedBy: "user-2",
      uploadedAt: new Date(2024, 1, 12),
    },
  ])

  if (!project) return null

  const totalBudget = budget.reduce((sum, item) => sum + item.allocated, 0)
  const totalSpent = budget.reduce((sum, item) => sum + item.spent, 0)
  const budgetUtilization = (totalSpent / totalBudget) * 100

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="p-6 border-b space-y-0">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-3xl">{project.icon}</div>
                <div className="flex-1">
                  <SheetTitle className="text-xl font-semibold mb-2">{project.name}</SheetTitle>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditMode(!editMode)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{project.progress.progress}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tasks</p>
                <p className="text-2xl font-bold">{project.progress.totalTasks}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Team</p>
                <p className="text-2xl font-bold">{project.members.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold">{Math.round(budgetUtilization)}%</p>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start mb-6">
                  <TabsTrigger value="overview" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="milestones" className="gap-2">
                    <Target className="h-4 w-4" />
                    Milestones
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="gap-2">
                    <Users className="h-4 w-4" />
                    Resources
                  </TabsTrigger>
                  <TabsTrigger value="budget" className="gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget
                  </TabsTrigger>
                  <TabsTrigger value="risks" className="gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risks
                  </TabsTrigger>
                  <TabsTrigger value="files" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Files
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                  {/* Project Info */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Project Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Status</p>
                        <Badge className={cn("capitalize", getStatusColor(project.status))}>{project.status}</Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Start Date</p>
                        <p className="font-medium">{formatDate(project.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">End Date</p>
                        <p className="font-medium">{formatDate(project.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Duration</p>
                        <p className="font-medium">
                          {Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24))}{" "}
                          days
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Progress Overview */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Progress Overview
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Progress</span>
                          <span className="text-sm text-muted-foreground">{project.progress.progress}%</span>
                        </div>
                        <Progress value={project.progress.progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="text-lg font-bold">{project.progress.completedTasks}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                          <Circle className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">In Progress</p>
                            <p className="text-lg font-bold">{project.progress.inProgressTasks}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Upcoming</p>
                            <p className="text-lg font-bold">{project.progress.upcomingTasks}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Overdue</p>
                            <p className="text-lg font-bold">{project.progress.overdueTasks}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Team Members */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Members
                      </h3>
                      <Button variant="outline" size="sm" onClick={() => setInvitationDialogOpen(true)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Invite Member
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {project.members.slice(0, 5).map((memberId) => {
                        const user = mockUsers.find((u) => u.id === memberId)
                        if (!user) return null
                        return (
                          <div
                            key={memberId}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.role}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {user.status}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </TabsContent>

                {/* Milestones Tab */}
                <TabsContent value="milestones" className="space-y-4 mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Project Milestones</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Milestone
                    </Button>
                  </div>

                  {milestones.map((milestone) => (
                    <Card key={milestone.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{milestone.title}</h4>
                            <Badge className={cn("capitalize text-xs", getStatusColor(milestone.status))}>
                              {milestone.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {formatDate(milestone.dueDate)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Layers className="h-3 w-3" />
                            <span>{milestone.tasks.length} tasks</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1 text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{milestone.progress}%</span>
                          </div>
                          <Progress value={milestone.progress} className="h-2" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources" className="space-y-4 mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Resource Allocation</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Assign Resource
                    </Button>
                  </div>

                  {resources.map((resource) => {
                    const user = mockUsers.find((u) => u.id === resource.userId)
                    if (!user) return null
                    return (
                      <Card key={resource.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{resource.role}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Allocation</span>
                            <span className="font-medium">{resource.allocation}%</span>
                          </div>
                          <Progress value={resource.allocation} className="h-2" />

                          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>From: {formatDate(resource.startDate)}</span>
                            </div>
                            {resource.endDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>To: {formatDate(resource.endDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </TabsContent>

                {/* Budget Tab */}
                <TabsContent value="budget" className="space-y-4 mt-0">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Spent</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalSpent)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalBudget - totalSpent)}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-muted-foreground">Budget Utilization</span>
                        <span className="font-medium">{Math.round(budgetUtilization)}%</span>
                      </div>
                      <Progress value={budgetUtilization} className="h-2" />
                    </div>
                  </Card>

                  <div className="space-y-3">
                    {budget.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{item.category}</h4>
                          <Badge variant="outline">{Math.round((item.spent / item.allocated) * 100)}%</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Allocated</span>
                            <span className="font-medium">{formatCurrency(item.allocated)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Spent</span>
                            <span className="font-medium text-orange-600">{formatCurrency(item.spent)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className="font-medium text-green-600">{formatCurrency(item.remaining)}</span>
                          </div>
                          <Progress value={(item.spent / item.allocated) * 100} className="h-2" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Risks Tab */}
                <TabsContent value="risks" className="space-y-4 mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Risk Management</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Risk
                    </Button>
                  </div>

                  {risks.map((risk) => {
                    const owner = mockUsers.find((u) => u.id === risk.owner)
                    return (
                      <Card key={risk.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{risk.title}</h4>
                              <Badge className={cn("capitalize text-xs", getStatusColor(risk.status))}>
                                {risk.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{risk.description}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Impact</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize",
                                risk.impact === "high" && "border-red-500 text-red-600",
                                risk.impact === "medium" && "border-orange-500 text-orange-600",
                                risk.impact === "low" && "border-green-500 text-green-600",
                              )}
                            >
                              {risk.impact}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Probability</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize",
                                risk.probability === "high" && "border-red-500 text-red-600",
                                risk.probability === "medium" && "border-orange-500 text-orange-600",
                                risk.probability === "low" && "border-green-500 text-green-600",
                              )}
                            >
                              {risk.probability}
                            </Badge>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Mitigation Strategy</p>
                          <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                          {owner && (
                            <div className="flex items-center gap-2 pt-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={owner.avatar || "/placeholder.svg"} alt={owner.name} />
                                <AvatarFallback className="text-xs">{owner.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">Owner: {owner.name}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="space-y-4 mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Project Files</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Upload File
                    </Button>
                  </div>

                  {files.map((file) => {
                    const uploader = mockUsers.find((u) => u.id === file.uploadedBy)
                    return (
                      <Card key={file.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="h-10 w-10 rounded bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.size} • Uploaded by {uploader?.name} • {formatDate(file.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Invitation Dialog */}
      <ProjectInvitationDialog
        projectId={project.id}
        projectName={project.name}
        open={invitationDialogOpen}
        onOpenChange={setInvitationDialogOpen}
      />
    </>
  )
}
