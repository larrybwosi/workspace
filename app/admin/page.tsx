"use client"

import * as React from "react"
import { Users, Settings, BarChart3, Shield, Activity, Database, Clock, UserPlus, AlertTriangle, TrendingUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { TopBar } from "@/components/layout/top-bar"
import { AdminOverview } from "@/components/features/admin/admin-overview"
import { AdminMembers } from "@/components/features/admin/admin-members"
import { AdminAnalytics } from "@/components/features/admin/admin-analytics"
import { AdminSettings } from "@/components/features/admin/admin-settings"
import { AdminActivity } from "@/components/features/admin/admin-activity"
import { AdminSecurity } from "@/components/features/admin/admin-security"

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("overview")

  return (
    <div className="flex h-screen bg-background">

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          channelName="System Administration"
          channelDescription="Manage your workspace settings, members, and analytics"
        />

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  System Administration
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage users, monitor system health, and configure workspace settings
                </p>
              </div>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-6 w-full max-w-4xl">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <AdminOverview />
              </TabsContent>

              <TabsContent value="members" className="mt-6">
                <AdminMembers />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <AdminAnalytics />
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <AdminActivity />
              </TabsContent>

              <TabsContent value="security" className="mt-6">
                <AdminSecurity />
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <AdminSettings />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
