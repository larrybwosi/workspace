"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { mockUsers } from "@/lib/mock-data"

interface ProjectAnalyticsPanelProps {
  projectId: string
  tasks?: any[]
}

export function ProjectAnalyticsPanel({ projectId, tasks = [] }: ProjectAnalyticsPanelProps) {
  // Calculate analytics
  const analytics = React.useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === "done").length
    const inProgress = tasks.filter((t) => t.status === "in-progress").length
    const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length
    const highPriority = tasks.filter((t) => t.priority === "high").length

    // Calculate velocity (tasks completed per week)
    const thisWeekCompleted = tasks.filter((t) => {
      if (t.status !== "done" || !t.updatedAt) return false
      const updated = new Date(t.updatedAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return updated >= weekAgo
    }).length

    // Calculate team workload
    const assigneeMap = new Map<string, number>()
    tasks.forEach((task) => {
      task.assignees?.forEach((assigneeId: string) => {
        assigneeMap.set(assigneeId, (assigneeMap.get(assigneeId) || 0) + 1)
      })
    })

    const teamWorkload = Array.from(assigneeMap.entries()).map(([userId, taskCount]) => {
      const user = mockUsers.find((u) => u.id === userId)
      return {
        userId,
        name: user?.name || "Unknown",
        avatar: user?.avatar,
        taskCount,
        completedCount: tasks.filter((t) => t.status === "done" && t.assignees?.includes(userId)).length,
      }
    })

    return {
      total,
      completed,
      inProgress,
      overdue,
      highPriority,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      velocity: thisWeekCompleted,
      teamWorkload: teamWorkload.sort((a, b) => b.taskCount - a.taskCount),
    }
  }, [tasks])

  // Mock trend data
  const trendData = {
    completionTrend: 12, // percent increase
    velocityTrend: 8,
    overdueTrend: -5,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Project Analytics</h2>
          <p className="text-sm text-muted-foreground">Track progress and team performance</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <BarChart3 className="h-4 w-4" />
          Full Report
        </Button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.completionRate}%</p>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {trendData.completionTrend > 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">+{trendData.completionTrend}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">{trendData.completionTrend}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs last week</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <Progress value={analytics.completionRate} className="h-1.5 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Velocity</p>
                <p className="text-2xl font-bold">{analytics.velocity}</p>
                <div className="flex items-center gap-1 text-xs mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{trendData.velocityTrend}</span>
                  <span className="text-muted-foreground">tasks/week</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{analytics.inProgress}</p>
                <p className="text-xs text-muted-foreground mt-1">{analytics.highPriority} high priority</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-500">{analytics.overdue}</p>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {trendData.overdueTrend < 0 ? (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">{trendData.overdueTrend}</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">+{trendData.overdueTrend}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs last week</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Workload */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Team Workload</CardTitle>
              <CardDescription>Task distribution across team members</CardDescription>
            </div>
            <Badge variant="outline">{analytics.teamWorkload.length} members</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {analytics.teamWorkload.length > 0 ? (
                analytics.teamWorkload.map((member) => (
                  <div key={member.userId} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <span className="text-sm text-muted-foreground">
                          {member.completedCount}/{member.taskCount} tasks
                        </span>
                      </div>
                      <Progress
                        value={member.taskCount > 0 ? (member.completedCount / member.taskCount) * 100 : 0}
                        className="h-1.5"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No team members assigned yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Task Distribution */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-400" />
                  <span className="text-sm">To Do</span>
                </div>
                <span className="text-sm font-medium">{tasks.filter((t) => t.status === "todo").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="text-sm font-medium">{analytics.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm">In Review</span>
                </div>
                <span className="text-sm font-medium">{tasks.filter((t) => t.status === "review").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Done</span>
                </div>
                <span className="text-sm font-medium">{analytics.completed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">By Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">High</span>
                </div>
                <span className="text-sm font-medium">{analytics.highPriority}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm">Medium</span>
                </div>
                <span className="text-sm font-medium">{tasks.filter((t) => t.priority === "medium").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Low</span>
                </div>
                <span className="text-sm font-medium">{tasks.filter((t) => t.priority === "low").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-400" />
                  <span className="text-sm">None</span>
                </div>
                <span className="text-sm font-medium">{tasks.filter((t) => !t.priority).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
