"use client"

import * as React from "react"
import { TrendingUp, Users, MessageSquare, FolderKanban, Clock } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Pie, PieChart, Cell } from "recharts"

export function AdminAnalytics() {
  const [timeRange, setTimeRange] = React.useState("30d")

  const userGrowthData = [
    { month: "Jan", users: 850 },
    { month: "Feb", users: 920 },
    { month: "Mar", users: 1050 },
    { month: "Apr", users: 1180 },
    { month: "May", users: 1247 },
  ]

  const activityData = [
    { date: "Week 1", messages: 4200, tasks: 380, projects: 42 },
    { date: "Week 2", messages: 4680, tasks: 420, projects: 48 },
    { date: "Week 3", messages: 5120, tasks: 390, projects: 51 },
    { date: "Week 4", messages: 5540, tasks: 450, projects: 56 },
  ]

  const projectStatusData = [
    { name: "Active", value: 89, color: "hsl(var(--chart-1))" },
    { name: "On Hold", value: 32, color: "hsl(var(--chart-2))" },
    { name: "Completed", value: 35, color: "hsl(var(--chart-3))" },
  ]

  const peakHoursData = [
    { hour: "6 AM", activity: 120 },
    { hour: "9 AM", activity: 450 },
    { hour: "12 PM", activity: 680 },
    { hour: "3 PM", activity: 820 },
    { hour: "6 PM", activity: 540 },
    { hour: "9 PM", activity: 280 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive insights into workspace activity</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* User Growth */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              User Growth Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Activity Overview */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Weekly Activity Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="messages" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tasks" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="projects" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Project Status & Peak Hours */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Project Status Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={projectStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Peak Activity Hours
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="activity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-6">
            <p className="text-muted-foreground">User-specific analytics will be displayed here</p>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card className="p-6">
            <p className="text-muted-foreground">Project analytics will be displayed here</p>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card className="p-6">
            <p className="text-muted-foreground">Engagement metrics will be displayed here</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
