"use client"

import * as React from "react"
import { Users, MessageSquare, FolderKanban, CheckCircle2, TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAdminStats } from "@/hooks/api/use-admin"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

export function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats()

  const mockStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalProjects: 156,
    totalTasks: 3421,
    completedTasks: 2103,
    totalMessages: 18542,
    storageUsed: 45.2,
    storageTotal: 100,
    userGrowth: 12.5,
    activityGrowth: 8.3,
  }

  const activityData = [
    { name: "Mon", users: 680, messages: 1240 },
    { name: "Tue", users: 720, messages: 1380 },
    { name: "Wed", users: 650, messages: 1150 },
    { name: "Thu", users: 780, messages: 1520 },
    { name: "Fri", users: 820, messages: 1680 },
    { name: "Sat", users: 520, messages: 840 },
    { name: "Sun", users: 480, messages: 720 },
  ]

  const data = stats || mockStats

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold">{data.totalUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{data.userGrowth}% from last month
                </span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-3xl font-bold">{data.activeUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((data.activeUsers / data.totalUsers) * 100).toFixed(1)}% engagement
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <p className="text-3xl font-bold">{data.totalProjects}</p>
              <p className="text-xs text-muted-foreground mt-1">{data.totalTasks} total tasks</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <FolderKanban className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
              <p className="text-3xl font-bold">{data.completedTasks}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((data.completedTasks / data.totalTasks) * 100).toFixed(1)}% completion rate
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Message Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Line type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Storage & System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Storage Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Used Space</span>
                <span className="text-sm font-medium">
                  {data.storageUsed} GB / {data.storageTotal} GB
                </span>
              </div>
              <Progress value={(data.storageUsed / data.storageTotal) * 100} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Files</p>
                <p className="text-lg font-bold">24.5 GB</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Messages</p>
                <p className="text-lg font-bold">12.8 GB</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Backups</p>
                <p className="text-lg font-bold">7.9 GB</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-950">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API Services</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-950">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time Sync</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-950">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Backup Status</span>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950">Running</Badge>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                2 minutes ago
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
