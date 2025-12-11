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
} from "lucide-react"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WorkspacePageProps {
  params: Promise<{ slug: string }>
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = use(params)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

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
    {
      title: "Team Members",
      value: "142",
      change: "+8",
      icon: Users,
      trend: "up",
      description: "new this month",
    },
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

  const recentProjects = [
    {
      id: "1",
      name: "Q1 Product Launch",
      progress: 67,
      dueDate: "2024-03-15",
      team: ["JD", "SM", "RK"],
      status: "on-track",
    },
    { id: "2", name: "Website Redesign", progress: 45, dueDate: "2024-03-20", team: ["AL", "TM"], status: "at-risk" },
    {
      id: "3",
      name: "Mobile App v2",
      progress: 82,
      dueDate: "2024-03-10",
      team: ["BH", "KL", "PM", "JW"],
      status: "on-track",
    },
  ]

  const recentActivity = [
    { id: "1", user: "Alice Johnson", action: "completed task", target: "Update homepage design", time: "2m ago" },
    { id: "2", user: "Bob Smith", action: "commented on", target: "Q1 Roadmap", time: "15m ago" },
    { id: "3", user: "Carol White", action: "created project", target: "Customer Portal", time: "1h ago" },
    { id: "4", user: "David Brown", action: "invited", target: "3 new members", time: "2h ago" },
  ]

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar workspaceSlug={slug} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden">
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
              <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening today.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button size="sm">
              <Activity className="h-4 w-4 mr-2" />
              View All Activity
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
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
                  <Button variant="ghost" size="sm">
                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{project.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {project.dueDate}
                          </span>
                          <Badge
                            variant={project.status === "on-track" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {project.status === "on-track" ? "On Track" : "At Risk"}
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
                        <span className="text-muted-foreground">Progress</span>
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

          {/* Performance Overview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Workspace Performance</CardTitle>
              <CardDescription>Key metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Task Completion</span>
                        <span className="text-sm text-muted-foreground">89%</span>
                      </div>
                      <Progress value={89} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Team Utilization</span>
                        <span className="text-sm text-muted-foreground">76%</span>
                      </div>
                      <Progress value={76} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Sprint Progress</span>
                        <span className="text-sm text-muted-foreground">62%</span>
                      </div>
                      <Progress value={62} className="h-2" />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="projects" className="mt-6">
                  <p className="text-sm text-muted-foreground">Project metrics and analytics will appear here.</p>
                </TabsContent>
                <TabsContent value="team" className="mt-6">
                  <p className="text-sm text-muted-foreground">Team performance metrics will appear here.</p>
                </TabsContent>
                <TabsContent value="activity" className="mt-6">
                  <p className="text-sm text-muted-foreground">Activity trends and insights will appear here.</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
