import * as React from "react"
import { Users, Settings, BarChart3, Shield, Activity, Sparkles, TrendingUp } from 'lucide-react'
import { useNavigate } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs"
import { ScrollArea } from "@repo/ui/components/scroll-area"
import { Button } from "@repo/ui/components/button"
import { TopBar } from "@repo/ui/layout/top-bar"
import { AdminSidebar } from "@repo/ui/layout/admin-sidebar"
import { AdminOverview } from "@repo/ui/features/admin/admin-overview"
import { AdminMembers } from "@repo/ui/features/admin/admin-members"
import { AdminAnalytics } from "@repo/ui/features/admin/admin-analytics"
import { AdminSettings } from "@repo/ui/features/admin/admin-settings"
import { AdminActivity } from "@repo/ui/features/admin/admin-activity"
import { AdminSecurity } from "@repo/ui/features/admin/admin-security"

export function AdminOverviewPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = React.useState("overview")
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          channelName="System Administration"
          channelDescription="Manage your workspace settings, members, and analytics"
        />

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-7 w-full max-w-5xl">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="assets" className="gap-2" onClick={() => navigate('/assets')}>
                  <Sparkles className="h-4 w-4" />
                  Assets
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
